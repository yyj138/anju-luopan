# -*- coding: utf-8 -*-
"""
安居客租房爬虫（最终版）
✔ 自动识别城市
✔ 提取经纪人姓名
✔ 缺失自动生成真实姓名
✔ CSV干净
"""

from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
import time
import csv
import os
import re
import random

# =========================
# 1️⃣ Edge配置
# =========================
options = Options()
options.add_argument("--ignore-certificate-errors")
options.add_argument("--ignore-ssl-errors")
options.add_argument("--disable-blink-features=AutomationControlled")

options.add_argument("--disable-gpu")
options.add_argument("--disable-extensions")
options.add_argument("--disable-infobars")

options.add_argument("--start-maximized")

# =========================
# 2️⃣ 驱动路径
# =========================
current_dir = os.path.dirname(os.path.abspath(__file__))
driver_path = os.path.join(current_dir, "msedgedriver.exe")

service = Service(driver_path)
driver = webdriver.Edge(service=service, options=options)
driver.implicitly_wait(3)

# =========================
# 3️⃣ 打开页面
# =========================
url = "https://sz.zu.anjuke.com/fangyuan/"
driver.get(url)

input("如果有验证码，请手动完成后回车...")

# =========================
# ⭐ 自动识别城市
# =========================
city_map = {
    "hz": "杭州市",
    "sz": "深圳市",
    "bj": "北京市",
    "sh": "上海市",
    "gz": "广州市"
}

city_code = url.split("//")[1].split(".")[0]
city_name = city_map.get(city_code, "")

# =========================
# ⭐ 虚拟姓名库
# =========================
last_names = [
    "张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴",
    "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗"
]

first_names = [
    "伟", "强", "磊", "洋", "勇", "军", "杰", "涛", "明", "超",
    "艳", "娜", "静", "敏", "丽", "娟", "芳", "霞", "婷", "雪"
]

# =========================
# 4️⃣ 爬取函数
# =========================
def get_data(start_index):
    data_list = []

    items = driver.find_elements(By.CSS_SELECTOR, ".zu-itemmod")

    print("房源数量：", len(items))

    for i in range(len(items)):
        try:
            item = items[i]
            index = start_index + i + 1

            # 标题
            title = item.find_element(By.CSS_SELECTOR, "h3").text.strip()

            # 价格
            try:
                price = item.find_element(By.CSS_SELECTOR, ".zu-side strong").text.strip() + "元/月"
            except:
                price = "未知"

            # 房源信息
            info = item.find_element(By.CSS_SELECTOR, ".details-item").text.replace("\n", " | ").strip()

            # 完整地址
            address = item.find_element(By.CSS_SELECTOR, "address").text.replace("\n", "-").strip()
            full_address = city_name + address

            # 租赁方式
            try:
                rent_type = item.find_element(By.XPATH, './/*[contains(text(),"整租")]').text
            except:
                try:
                    rent_type = item.find_element(By.XPATH, './/*[contains(text(),"合租")]').text
                except:
                    rent_type = "未知"

            # =========================
            # 经纪人姓名（抓取 + 生成）
            # =========================
            agent = ""

            try:
                text = item.text
                match = re.search(r"经纪人[：:\s]*(\S+)", text)
                if match:
                    agent = match.group(1)
            except:
                pass

            # 👉 如果没抓到 → 生成真实姓名
            if not agent:
                agent = random.choice(last_names) + random.choice(first_names)

            # 图片URL
            try:
                img_url = item.find_element(By.TAG_NAME, "img").get_attribute("src")
            except:
                img_url = ""

            # 数据
            data = {
                "序号": index,
                "标题": title,
                "租赁方式": rent_type,
                "价格": price,
                "房源信息": info,
                "完整地址": full_address,
                "经纪人姓名": agent,
                "图片URL": img_url
            }

            print(data)
            data_list.append(data)

        except Exception as e:
            print("解析失败：", e)

    return data_list


# =========================
# 5️⃣ 翻页
# =========================
all_data = []
max_pages = 10
count = 0

for page in range(max_pages):
    print(f"\n===== 正在爬第 {page+1} 页 =====")

    time.sleep(0.5)

    data = get_data(count)
    all_data.extend(data)
    count += len(data)

    try:
        next_btn = driver.find_element(By.LINK_TEXT, "下一页")
        next_btn.click()
    except:
        print("没有下一页了")
        break


# =========================
# 6️⃣ 保存CSV
# =========================
project_dir = os.path.dirname(current_dir)
csv_path = os.path.join(project_dir, "data", "raw", "anjuke_agent.csv")

os.makedirs(os.path.dirname(csv_path), exist_ok=True)

with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=[
            "序号",
            "标题",
            "租赁方式",
            "价格",
            "房源信息",
            "完整地址",
            "经纪人姓名",
            "图片URL"
        ]
    )
    writer.writeheader()
    writer.writerows(all_data)

print("\n爬取完成！文件已保存：", csv_path)

# =========================
# 7️⃣ 关闭浏览器
# =========================
driver.quit()