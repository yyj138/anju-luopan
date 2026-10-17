"""
统一训练模块 - 支持单任务和多任务训练
数据类型：real（真实）、ai（AI生成）、fake（非AI伪造）
"""

import os
import time
import argparse
import numpy as np
from tqdm import tqdm
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from src.data_utils.unified_dataset import get_dataloaders, get_transforms
# 尝试导入SummaryWriter，如果不可用则使用空对象
try:
    from torch.utils.tensorboard import SummaryWriter
    has_tensorboard = True
except ImportError:
    class SummaryWriter:
        def __init__(self, *args, **kwargs):
            pass
        def add_scalar(self, *args, **kwargs):
            pass
        def close(self):
            pass
    has_tensorboard = False

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.models import get_model
from utils.logger import setup_logger, TrainingProgressLogger

import albumentations as A
from albumentations.pytorch import ToTensorV2
from PIL import Image
def train_model(args):
    """
    统一训练函数 - 支持单任务和多任务训练
    """
    # 设置日志
    logger = setup_logger(
        name="UnifiedTraining",
        log_level="INFO",
        log_file=os.path.join(args.save_dir, "training.log"),
        console_output=True
    )
    progress_logger = TrainingProgressLogger(logger)
    
    # 设置随机种子
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(args.seed)
    
    # 设置设备
    device = torch.device('cuda' if torch.cuda.is_available() and not args.no_cuda else 'cpu')
    
    # 创建保存目录
    os.makedirs(args.save_dir, exist_ok=True)
    
    # 准备数据目录
    data_dirs = {}
    if args.real_dir:
        data_dirs['real'] = args.real_dir
    if args.ai_dir:
        data_dirs['ai'] = args.ai_dir
    if args.fake_dir:
        data_dirs['fake'] = args.fake_dir
    
    if not data_dirs:
        raise ValueError("至少需要一个数据目录 (real, ai, 或 fake)")
    
    # 获取数据加载器
    dataloaders = get_dataloaders(
        data_dirs, batch_size=args.batch_size, img_size=args.img_size,
        num_workers=args.num_workers, seed=args.seed
    )
    
    # 获取模型
    model = get_model(
        args.model, num_classes=2, pretrained=args.pretrained,
        multi_task=args.multi_task
    )
    model = model.to(device)
    
    # 损失函数和优化器
    criterion = nn.CrossEntropyLoss()
    
    if args.optimizer == 'adam':
        optimizer = optim.Adam(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    elif args.optimizer == 'sgd':
        optimizer = optim.SGD(model.parameters(), lr=args.lr, momentum=0.9, weight_decay=args.weight_decay)
    else:
        raise ValueError(f"未知的优化器: {args.optimizer}")
    
    # 学习率调度器
    if args.lr_scheduler == 'step':
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=args.lr_step, gamma=args.lr_gamma)
    elif args.lr_scheduler == 'cosine':
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    elif args.lr_scheduler == 'plateau':
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=5, factor=0.5)
    else:
        scheduler = None
    
    # TensorBoard
    writer = SummaryWriter(log_dir=os.path.join(args.save_dir, 'logs'))
    
    # 开始训练
    progress_logger.start_training(args.epochs, args.model, str(device))
    
    best_val_acc = 0.0
    best_val_loss = float('inf')
    
    for epoch in range(args.epochs):
        progress_logger.start_epoch(epoch, args.epochs)
        
        # 训练阶段
        model.train()
        train_loss = 0.0
        train_metrics = {'forgery_correct': 0, 'ai_correct': 0, 'total': 0}
        
        for images, labels in tqdm(dataloaders['train'], desc="训练"):
            images = images.to(device)
            forgery_labels = labels['forgery'].to(device)
            ai_labels = labels['ai'].to(device)
            
            optimizer.zero_grad()
            
            outputs = model(images)
            
            if args.multi_task:
                # 多任务模式
                loss_forgery = criterion(outputs['forgery'], forgery_labels)
                loss_ai = criterion(outputs['ai'], ai_labels)
                loss = loss_forgery + loss_ai
                
                # 统计
                _, pred_forgery = outputs['forgery'].max(1)
                _, pred_ai = outputs['ai'].max(1)
                train_metrics['forgery_correct'] += pred_forgery.eq(forgery_labels).sum().item()
                train_metrics['ai_correct'] += pred_ai.eq(ai_labels).sum().item()
            else:
                # 单任务模式（仅伪造检测）
                loss = criterion(outputs, forgery_labels)
                _, pred_forgery = outputs.max(1)
                train_metrics['forgery_correct'] += pred_forgery.eq(forgery_labels).sum().item()
            
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            train_metrics['total'] += forgery_labels.size(0)
        
        train_loss /= len(dataloaders['train'])
        train_forgery_acc = 100.0 * train_metrics['forgery_correct'] / train_metrics['total']
        train_ai_acc = 100.0 * train_metrics['ai_correct'] / train_metrics['total'] if args.multi_task else 0
        
        # 验证阶段
        model.eval()
        val_loss = 0.0
        val_metrics = {'forgery_correct': 0, 'ai_correct': 0, 'total': 0}
        
        with torch.no_grad():
            for images, labels in tqdm(dataloaders['val'], desc="验证"):
                images = images.to(device)
                forgery_labels = labels['forgery'].to(device)
                ai_labels = labels['ai'].to(device)
                
                outputs = model(images)
                
                if args.multi_task:
                    loss_forgery = criterion(outputs['forgery'], forgery_labels)
                    loss_ai = criterion(outputs['ai'], ai_labels)
                    loss = loss_forgery + loss_ai
                    
                    _, pred_forgery = outputs['forgery'].max(1)
                    _, pred_ai = outputs['ai'].max(1)
                    val_metrics['forgery_correct'] += pred_forgery.eq(forgery_labels).sum().item()
                    val_metrics['ai_correct'] += pred_ai.eq(ai_labels).sum().item()
                else:
                    loss = criterion(outputs, forgery_labels)
                    _, pred_forgery = outputs.max(1)
                    val_metrics['forgery_correct'] += pred_forgery.eq(forgery_labels).sum().item()
                
                val_loss += loss.item()
                val_metrics['total'] += forgery_labels.size(0)
        
        val_loss /= len(dataloaders['val'])
        val_forgery_acc = 100.0 * val_metrics['forgery_correct'] / val_metrics['total']
        val_ai_acc = 100.0 * val_metrics['ai_correct'] / val_metrics['total'] if args.multi_task else 0
        val_acc = (val_forgery_acc + val_ai_acc) / 2 if args.multi_task else val_forgery_acc
        
        # 更新学习率
        if scheduler is not None:
            if args.lr_scheduler == 'plateau':
                scheduler.step(val_loss)
            else:
                scheduler.step()
        
        current_lr = optimizer.param_groups[0]['lr']
        
        # 记录结果
        progress_logger.log_epoch_results(epoch, train_loss, train_forgery_acc, val_loss, val_forgery_acc, current_lr)
        
        # TensorBoard
        writer.add_scalar('Loss/train', train_loss, epoch)
        writer.add_scalar('Loss/val', val_loss, epoch)
        writer.add_scalar('Accuracy/forgery_train', train_forgery_acc, epoch)
        writer.add_scalar('Accuracy/forgery_val', val_forgery_acc, epoch)
        if args.multi_task:
            writer.add_scalar('Accuracy/ai_train', train_ai_acc, epoch)
            writer.add_scalar('Accuracy/ai_val', val_ai_acc, epoch)
        writer.add_scalar('LearningRate', current_lr, epoch)
        
        # 保存最佳模型
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'val_loss': val_loss,
                'args': vars(args)
            }, os.path.join(args.save_dir, 'best_model.pth'))
            progress_logger.log_best_model(val_acc)
        
        # 定期保存检查点
        if (epoch + 1) % args.save_interval == 0:
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'val_loss': val_loss,
            }, os.path.join(args.save_dir, f'checkpoint_epoch{epoch+1}.pth'))
    
    # 保存最终模型
    torch.save({
        'epoch': args.epochs,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, os.path.join(args.save_dir, 'final_model.pth'))
    
    progress_logger.finish_training(best_val_acc)
    writer.close()


def parse_args():
    parser = argparse.ArgumentParser(description='统一图像伪造检测训练')
    
    # 数据目录参数 - 三种数据类型
    parser.add_argument('--real-dir', type=str, default=None, help='真实图像目录')
    parser.add_argument('--ai-dir', type=str, default=None, help='AI生成图像目录')
    parser.add_argument('--fake-dir', type=str, default=None, help='非AI伪造图像目录')
    
    # 数据加载参数
    parser.add_argument('--img-size', type=int, default=224, help='图像大小')
    parser.add_argument('--batch-size', type=int, default=32, help='批次大小')
    parser.add_argument('--num-workers', type=int, default=4, help='数据加载线程数')
    
    # 模型参数
    parser.add_argument('--model', type=str, default='efficientnet_b0',
                        choices=['efficientnet_b0', 'efficientnet_b2', 'resnet18', 'resnet50', 'xception', 'cnn'],
                        help='模型架构')
    parser.add_argument('--pretrained', action='store_true', help='使用预训练权重')
    parser.add_argument('--multi-task', action='store_true', help='启用多任务训练（伪造检测+AI检测）')
    
    # 训练参数
    parser.add_argument('--epochs', type=int, default=30, help='训练周期数')
    parser.add_argument('--lr', type=float, default=0.001, help='学习率')
    parser.add_argument('--weight-decay', type=float, default=1e-4, help='权重衰减')
    parser.add_argument('--optimizer', type=str, default='adam', choices=['adam', 'sgd'], help='优化器')
    
    # 学习率调度
    parser.add_argument('--lr-scheduler', type=str, default='step',
                        choices=['step', 'cosine', 'plateau', 'none'], help='学习率调度器')
    parser.add_argument('--lr-step', type=int, default=10, help='学习率衰减步长')
    parser.add_argument('--lr-gamma', type=float, default=0.1, help='学习率衰减系数')
    
    # 其他参数
    parser.add_argument('--seed', type=int, default=42, help='随机种子')
    parser.add_argument('--save-dir', type=str, default='models/saved', help='模型保存目录')
    parser.add_argument('--save-interval', type=int, default=5, help='检查点保存间隔')
    parser.add_argument('--no-cuda', action='store_true', help='禁用CUDA')
    
    return parser.parse_args()


if __name__ == '__main__':
    args = parse_args()
    train_model(args)
