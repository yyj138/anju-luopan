"""
统一数据集模块
支持三种数据类型：real、ai、fake
标签格式：{'forgery': 0/1, 'ai': 0/1}
"""

import os
import numpy as np
from PIL import Image
from torch.utils.data import Dataset, DataLoader
import albumentations as A
from albumentations.pytorch import ToTensorV2


class UnifiedForensicsDataset(Dataset):
    def __init__(self, data_dirs, transform=None, split='train', seed=42):
        """
        data_dirs: dict，例如 {'real': path, 'ai': path, 'fake': path}
        split: 'train', 'val', 'test'
        """
        self.data_dirs = data_dirs
        self.transform = transform
        self.split = split
        np.random.seed(seed)

        # 收集所有图像路径和标签
        self.images = []
        self.labels = []  # 每个元素是 {'forgery': 0/1, 'ai': 0/1}

        # real: forgery=0, ai=0
        if 'real' in data_dirs and os.path.exists(data_dirs['real']):
            real_images = self._get_images(data_dirs['real'])
            self.images.extend(real_images)
            self.labels.extend([{'forgery': 0, 'ai': 0}] * len(real_images))

        # ai: forgery=1, ai=1
        if 'ai' in data_dirs and os.path.exists(data_dirs['ai']):
            ai_images = self._get_images(data_dirs['ai'])
            self.images.extend(ai_images)
            self.labels.extend([{'forgery': 1, 'ai': 1}] * len(ai_images))

        # fake: forgery=1, ai=0
        if 'fake' in data_dirs and os.path.exists(data_dirs['fake']):
            fake_images = self._get_images(data_dirs['fake'])
            self.images.extend(fake_images)
            self.labels.extend([{'forgery': 1, 'ai': 0}] * len(fake_images))

        # 分割数据集
        self._split_dataset(split)

    def _get_images(self, directory):
        valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')
        images = []
        for fname in os.listdir(directory):
            if fname.lower().endswith(valid_extensions):
                images.append(os.path.join(directory, fname))
        return sorted(images)

    def _split_dataset(self, split):
        n = len(self.images)
        indices = np.arange(n)
        np.random.shuffle(indices)

        train_end = int(0.7 * n)
        val_end = int(0.85 * n)

        if split == 'train':
            selected = indices[:train_end]
        elif split == 'val':
            selected = indices[train_end:val_end]
        else:  # test
            selected = indices[val_end:]

        self.images = [self.images[i] for i in selected]
        self.labels = [self.labels[i] for i in selected]

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = self.images[idx]
        label = self.labels[idx]

        image = Image.open(img_path).convert('RGB')
        image = np.array(image)

        if self.transform:
            transformed = self.transform(image=image)
            image = transformed['image']

        return image, label


def get_transforms(img_size=224):
    train_transform = A.Compose([
        A.Resize(img_size, img_size),
        A.RandomBrightnessContrast(p=0.5),
        A.HorizontalFlip(p=0.5),
        A.ShiftScaleRotate(p=0.5),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])
    val_transform = A.Compose([
        A.Resize(img_size, img_size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])
    return {'train': train_transform, 'val': val_transform, 'test': val_transform}


def get_dataloaders(data_dirs, batch_size=32, img_size=224, num_workers=4, seed=42):
    transforms_dict = get_transforms(img_size)

    train_dataset = UnifiedForensicsDataset(data_dirs, transforms_dict['train'], 'train', seed)
    val_dataset = UnifiedForensicsDataset(data_dirs, transforms_dict['val'], 'val', seed)
    test_dataset = UnifiedForensicsDataset(data_dirs, transforms_dict['test'], 'test', seed)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True,
                              num_workers=num_workers, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False,
                            num_workers=num_workers, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False,
                             num_workers=num_workers, pin_memory=True)

    return {'train': train_loader, 'val': val_loader, 'test': test_loader}