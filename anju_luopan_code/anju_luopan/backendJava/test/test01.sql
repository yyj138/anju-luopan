CREATE DATABASE IF NOT EXISTS anju_luopan;

USE anju_luopan;

CREATE TABLE IF NOT EXISTS house_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    house_address VARCHAR(255),
    rent_price INT,
    area FLOAT,
    user_salary INT,
    commute_time INT,
    risk_score INT,
    formaldehyde_risk INT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO house_info (house_address, rent_price, area, user_salary, commute_time, risk_score, formaldehyde_risk) VALUES
('北京市朝阳区望京SOHO附近', 4500, 65.5, 15000, 25, 85, 1),
('上海市浦东新区陆家嘴', 6800, 80.0, 20000, 30, 90, 0),
('深圳市南山区科技园', 5200, 70.0, 18000, 20, 88, 1);