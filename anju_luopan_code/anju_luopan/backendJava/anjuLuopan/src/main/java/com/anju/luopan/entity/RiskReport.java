package com.anju.luopan.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("risk_report")
public class RiskReport {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long houseId;
    private String areaCode;
    private String reportType; // house-房屋报告, area-区域报告
    private Integer riskScore;
    private String riskLevel; // low-低风险, medium-中风险, high-高风险
    private String content; // JSON格式的详细报告
    private LocalDateTime createTime;
}