#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
日志配置模块
提供统一的日志记录功能，替换print语句
"""

import os
import sys
import logging
import logging.handlers
from datetime import datetime
from typing import Optional


class ColoredFormatter(logging.Formatter):
    """彩色日志格式化器"""
    
    # 颜色代码
    COLORS = {
        'DEBUG': '\033[36m',     # 青色
        'INFO': '\033[32m',      # 绿色
        'WARNING': '\033[33m',   # 黄色
        'ERROR': '\033[31m',     # 红色
        'CRITICAL': '\033[35m',  # 紫色
        'RESET': '\033[0m'       # 重置
    }
    
    def format(self, record):
        # 添加颜色
        if record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.COLORS['RESET']}"
        
        return super().format(record)


def setup_logger(
    name: str = "VerifyVision",
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    console_output: bool = True,
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> logging.Logger:
    """
    设置日志记录器
    
    Args:
        name: 日志记录器名称
        log_level: 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: 日志文件路径，如果为None则不写入文件
        console_output: 是否输出到控制台
        max_file_size: 日志文件最大大小（字节）
        backup_count: 备份文件数量
    
    Returns:
        配置好的日志记录器
    """
    # 创建日志记录器
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # 清除现有的处理器
    logger.handlers.clear()
    
    # 创建格式化器
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    console_formatter = ColoredFormatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # 控制台处理器
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, log_level.upper()))
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
    
    # 文件处理器
    if log_file:
        # 确保日志目录存在
        log_dir = os.path.dirname(log_file)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)
        
        # 使用RotatingFileHandler实现日志轮转
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)  # 文件记录所有级别
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str = "VerifyVision") -> logging.Logger:
    """
    获取日志记录器实例
    
    Args:
        name: 日志记录器名称
    
    Returns:
        日志记录器实例
    """
    return logging.getLogger(name)


# 创建默认的日志记录器
default_logger = setup_logger(
    name="VerifyVision",
    log_level="INFO",
    log_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs", "training.log"),
    console_output=True
)


# 便捷函数
def log_info(message: str, logger: Optional[logging.Logger] = None):
    """记录信息日志"""
    if logger is None:
        logger = default_logger
    logger.info(message)


def log_warning(message: str, logger: Optional[logging.Logger] = None):
    """记录警告日志"""
    if logger is None:
        logger = default_logger
    logger.warning(message)


def log_error(message: str, logger: Optional[logging.Logger] = None):
    """记录错误日志"""
    if logger is None:
        logger = default_logger
    logger.error(message)


def log_debug(message: str, logger: Optional[logging.Logger] = None):
    """记录调试日志"""
    if logger is None:
        logger = default_logger
    logger.debug(message)


def log_critical(message: str, logger: Optional[logging.Logger] = None):
    """记录严重错误日志"""
    if logger is None:
        logger = default_logger
    logger.critical(message)


# 训练进度日志记录器
class TrainingProgressLogger:
    """训练进度日志记录器"""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or default_logger
        self.start_time = None
        self.epoch_start_time = None
    
    def start_training(self, total_epochs: int, model_name: str, device: str):
        """开始训练"""
        self.start_time = datetime.now()
        self.logger.info("=" * 60)
        self.logger.info(f"开始训练模型: {model_name}")
        self.logger.info(f"训练设备: {device}")
        self.logger.info(f"总训练轮数: {total_epochs}")
        self.logger.info("=" * 60)
    
    def start_epoch(self, epoch: int, total_epochs: int):
        """开始新的训练轮"""
        self.epoch_start_time = datetime.now()
        self.logger.info(f"开始第 {epoch+1}/{total_epochs} 轮训练")
    
    def log_epoch_results(self, epoch: int, train_loss: float, train_acc: float, 
                         val_loss: float, val_acc: float, lr: float):
        """记录轮次结果"""
        epoch_time = datetime.now() - self.epoch_start_time
        self.logger.info(f"第 {epoch+1} 轮完成 (耗时: {epoch_time.total_seconds():.1f}s)")
        self.logger.info(f"  训练 - 损失: {train_loss:.4f}, 准确率: {train_acc:.2f}%")
        self.logger.info(f"  验证 - 损失: {val_loss:.4f}, 准确率: {val_acc:.2f}%")
        self.logger.info(f"  学习率: {lr:.6f}")
    
    def log_best_model(self, val_acc: float):
        """记录最佳模型保存"""
        self.logger.info(f"💾 保存最佳模型 (验证准确率: {val_acc:.2f}%)")
    
    def finish_training(self, best_val_acc: float):
        """完成训练"""
        total_time = datetime.now() - self.start_time
        self.logger.info("=" * 60)
        self.logger.info(f"训练完成! 总耗时: {total_time.total_seconds()/60:.2f} 分钟")
        self.logger.info(f"最佳验证准确率: {best_val_acc:.2f}%")
        self.logger.info("=" * 60)


# 评估进度日志记录器
class EvaluationProgressLogger:
    """评估进度日志记录器"""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or default_logger
    
    def start_evaluation(self, model_name: str, checkpoint_path: str, device: str):
        """开始评估"""
        self.logger.info("=" * 60)
        self.logger.info(f"开始评估模型: {model_name}")
        self.logger.info(f"检查点路径: {checkpoint_path}")
        self.logger.info(f"评估设备: {device}")
        self.logger.info("=" * 60)
    
    def log_evaluation_results(self, test_loss: float, accuracy: float, 
                              precision: float, recall: float, f1_score: float, auc: float):
        """记录评估结果"""
        self.logger.info("=" * 60)
        self.logger.info("评估结果:")
        self.logger.info(f"  测试损失: {test_loss:.4f}")
        self.logger.info(f"  测试准确率: {accuracy:.2f}%")
        self.logger.info(f"  精确率: {precision:.4f}")
        self.logger.info(f"  召回率: {recall:.4f}")
        self.logger.info(f"  F1分数: {f1_score:.4f}")
        self.logger.info(f"  AUC: {auc:.4f}")
        self.logger.info("=" * 60)
    
    def finish_evaluation(self, results_dir: str):
        """完成评估"""
        self.logger.info(f"评估结果已保存到: {results_dir}")


if __name__ == "__main__":
    # 测试日志功能
    logger = setup_logger("TestLogger", "DEBUG")
    
    logger.debug("这是调试信息")
    logger.info("这是普通信息")
    logger.warning("这是警告信息")
    logger.error("这是错误信息")
    logger.critical("这是严重错误信息")
    
    # 测试进度记录器
    progress_logger = TrainingProgressLogger(logger)
    progress_logger.start_training(10, "EfficientNet-B0", "cpu")
    progress_logger.start_epoch(0, 10)
    progress_logger.log_epoch_results(0, 0.5, 85.0, 0.4, 90.0, 0.001)
    progress_logger.log_best_model(90.0)
    progress_logger.finish_training(90.0)
