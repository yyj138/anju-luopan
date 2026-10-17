-- 1. 先选择数据库
USE anju_luopan;

-- 2. 再创建表
CREATE TABLE IF NOT EXISTS user_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar VARCHAR(255),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_favorite (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    house_id BIGINT NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_info(id),
    FOREIGN KEY (house_id) REFERENCES house_info(id)
);

CREATE TABLE IF NOT EXISTS risk_report (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    house_id BIGINT,
    area_code VARCHAR(20),
    report_type VARCHAR(20),
    risk_score INT,
    risk_level VARCHAR(10),
    content TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES house_info(id)
);

CREATE TABLE IF NOT EXISTS house_view_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    house_id BIGINT,
    view_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_info(id),
    FOREIGN KEY (house_id) REFERENCES house_info(id)
);