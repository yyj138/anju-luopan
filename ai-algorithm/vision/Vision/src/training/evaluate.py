import os
import sys
import argparse
import numpy as np
import torch
import torch.nn as nn
from tqdm import tqdm
from sklearn.metrics import confusion_matrix, classification_report, roc_curve, auc
import matplotlib.pyplot as plt

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.data_utils.unified_dataset import get_dataloaders
from src.models.models import get_model
from src.utils.logger import setup_logger, EvaluationProgressLogger


def evaluate_model(args):
    # 准备数据目录字典
    data_dirs = {}
    if args.real_dir:
        data_dirs['real'] = args.real_dir
    if args.ai_dir:
        data_dirs['ai'] = args.ai_dir
    if args.fake_dir:
        data_dirs['fake'] = args.fake_dir

    if not data_dirs:
        raise ValueError("至少需要提供一个数据目录 (real/ai/fake)")

    # 获取数据加载器
    dataloaders = get_dataloaders(
        data_dirs,
        batch_size=args.batch_size,
        img_size=args.img_size,
        num_workers=args.num_workers,
        seed=42
    )

    device = torch.device('cuda' if torch.cuda.is_available() and not args.no_cuda else 'cpu')

    # 加载模型
    model = get_model(args.model, num_classes=2, multi_task=args.multi_task)
    checkpoint = torch.load(args.checkpoint, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()

    criterion = nn.CrossEntropyLoss()

    all_preds_forgery = []
    all_labels_forgery = []
    all_probs_forgery = []
    if args.multi_task:
        all_preds_ai = []
        all_labels_ai = []
        all_probs_ai = []

    test_loss = 0.0

    with torch.no_grad():
        for images, labels in tqdm(dataloaders['test'], desc="评估"):
            images = images.to(device)
            forgery_labels = labels['forgery'].to(device)
            ai_labels = labels['ai'].to(device)

            outputs = model(images)

            if args.multi_task:
                loss = criterion(outputs['forgery'], forgery_labels) + criterion(outputs['ai'], ai_labels)
                test_loss += loss.item()

                # 伪造检测
                probs_forgery = torch.softmax(outputs['forgery'], dim=1)
                _, pred_forgery = outputs['forgery'].max(1)
                all_preds_forgery.extend(pred_forgery.cpu().numpy())
                all_labels_forgery.extend(forgery_labels.cpu().numpy())
                all_probs_forgery.extend(probs_forgery[:, 1].cpu().numpy())

                # AI检测
                probs_ai = torch.softmax(outputs['ai'], dim=1)
                _, pred_ai = outputs['ai'].max(1)
                all_preds_ai.extend(pred_ai.cpu().numpy())
                all_labels_ai.extend(ai_labels.cpu().numpy())
                all_probs_ai.extend(probs_ai[:, 1].cpu().numpy())
            else:
                loss = criterion(outputs, forgery_labels)
                test_loss += loss.item()

                probs = torch.softmax(outputs, dim=1)
                _, pred = outputs.max(1)
                all_preds_forgery.extend(pred.cpu().numpy())
                all_labels_forgery.extend(forgery_labels.cpu().numpy())
                all_probs_forgery.extend(probs[:, 1].cpu().numpy())

    test_loss /= len(dataloaders['test'])

    # 计算指标（伪造检测）
    accuracy_forgery = (np.array(all_preds_forgery) == np.array(all_labels_forgery)).mean() * 100
    cm_forgery = confusion_matrix(all_labels_forgery, all_preds_forgery)
    tn, fp, fn, tp = cm_forgery.ravel()
    precision_forgery = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall_forgery = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1_forgery = 2 * precision_forgery * recall_forgery / (precision_forgery + recall_forgery) if (precision_forgery + recall_forgery) > 0 else 0
    fpr, tpr, _ = roc_curve(all_labels_forgery, all_probs_forgery)
    auc_forgery = auc(fpr, tpr)

    # 记录结果
    logger = setup_logger("Evaluation", log_level="INFO", log_file=os.path.join(args.results_dir, "evaluation.log"))
    progress_logger = EvaluationProgressLogger(logger)
    progress_logger.start_evaluation(args.model, args.checkpoint, str(device))
    progress_logger.log_evaluation_results(test_loss, accuracy_forgery, precision_forgery, recall_forgery, f1_forgery, auc_forgery)

    # 保存混淆矩阵图
    plt.figure(figsize=(8,6))
    plt.imshow(cm_forgery, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix (Forgery Detection)')
    plt.colorbar()
    tick_marks = np.arange(2)
    plt.xticks(tick_marks, ['Real', 'Fake'])
    plt.yticks(tick_marks, ['Real', 'Fake'])
    for i in range(2):
        for j in range(2):
            plt.text(j, i, cm_forgery[i, j], ha='center', va='center', color='white' if cm_forgery[i, j] > cm_forgery.max()/2 else 'black')
    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    plt.tight_layout()
    plt.savefig(os.path.join(args.results_dir, 'confusion_matrix_forgery.png'))

    if args.multi_task:
        # 计算 AI 检测指标
        accuracy_ai = (np.array(all_preds_ai) == np.array(all_labels_ai)).mean() * 100
        cm_ai = confusion_matrix(all_labels_ai, all_preds_ai)
        tn_ai, fp_ai, fn_ai, tp_ai = cm_ai.ravel()
        precision_ai = tp_ai / (tp_ai + fp_ai) if (tp_ai + fp_ai) > 0 else 0
        recall_ai = tp_ai / (tp_ai + fn_ai) if (tp_ai + fn_ai) > 0 else 0
        f1_ai = 2 * precision_ai * recall_ai / (precision_ai + recall_ai) if (precision_ai + recall_ai) > 0 else 0
        fpr_ai, tpr_ai, _ = roc_curve(all_labels_ai, all_probs_ai)
        auc_ai = auc(fpr_ai, tpr_ai)

        logger.info("AI Detection Metrics:")
        logger.info(f"  Accuracy: {accuracy_ai:.2f}%")
        logger.info(f"  Precision: {precision_ai:.4f}")
        logger.info(f"  Recall: {recall_ai:.4f}")
        logger.info(f"  F1: {f1_ai:.4f}")
        logger.info(f"  AUC: {auc_ai:.4f}")

        # 保存 AI 混淆矩阵
        plt.figure(figsize=(8,6))
        plt.imshow(cm_ai, interpolation='nearest', cmap=plt.cm.Blues)
        plt.title('Confusion Matrix (AI Detection)')
        plt.colorbar()
        plt.xticks(tick_marks, ['Non-AI', 'AI'])
        plt.yticks(tick_marks, ['Non-AI', 'AI'])
        for i in range(2):
            for j in range(2):
                plt.text(j, i, cm_ai[i, j], ha='center', va='center', color='white' if cm_ai[i, j] > cm_ai.max()/2 else 'black')
        plt.ylabel('True label')
        plt.xlabel('Predicted label')
        plt.tight_layout()
        plt.savefig(os.path.join(args.results_dir, 'confusion_matrix_ai.png'))

    # 保存摘要
    with open(os.path.join(args.results_dir, 'results_summary.txt'), 'w') as f:
        f.write(f"Model: {args.model}\n")
        f.write(f"Checkpoint: {args.checkpoint}\n")
        f.write(f"Test Loss: {test_loss:.4f}\n")
        f.write(f"Forgery Detection:\n")
        f.write(f"  Accuracy: {accuracy_forgery:.2f}%\n")
        f.write(f"  Precision: {precision_forgery:.4f}\n")
        f.write(f"  Recall: {recall_forgery:.4f}\n")
        f.write(f"  F1: {f1_forgery:.4f}\n")
        f.write(f"  AUC: {auc_forgery:.4f}\n")
        if args.multi_task:
            f.write(f"AI Detection:\n")
            f.write(f"  Accuracy: {accuracy_ai:.2f}%\n")
            f.write(f"  Precision: {precision_ai:.4f}\n")
            f.write(f"  Recall: {recall_ai:.4f}\n")
            f.write(f"  F1: {f1_ai:.4f}\n")
            f.write(f"  AUC: {auc_ai:.4f}\n")

    progress_logger.finish_evaluation(args.results_dir)


def parse_args():
    parser = argparse.ArgumentParser(description='图像伪造检测评估')
    parser.add_argument('--real-dir', type=str, default=None, help='真实图像目录')
    parser.add_argument('--ai-dir', type=str, default=None, help='AI生成图像目录')
    parser.add_argument('--fake-dir', type=str, default=None, help='非AI伪造图像目录')
    parser.add_argument('--img-size', type=int, default=224, help='图像大小')
    parser.add_argument('--batch-size', type=int, default=32, help='批次大小')
    parser.add_argument('--num-workers', type=int, default=4, help='数据加载线程数')
    parser.add_argument('--no-cuda', action='store_true', help='禁用CUDA')
    parser.add_argument('--results-dir', type=str, default='results', help='结果保存目录')
    parser.add_argument('--checkpoint', type=str, required=True, help='模型检查点路径')
    parser.add_argument('--model', type=str, default='efficientnet_b0',
                        choices=['efficientnet_b0', 'efficientnet_b2', 'resnet18', 'resnet50', 'xception', 'cnn'],
                        help='模型名称')
    parser.add_argument('--multi-task', action='store_true', help='启用多任务评估')
    return parser.parse_args()


if __name__ == '__main__':
    args = parse_args()
    evaluate_model(args)