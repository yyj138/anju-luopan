package com.anju.luopan.service.impl;

import com.anju.luopan.service.RiskReportService;
import com.anju.luopan.util.Result;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class RiskReportServiceImpl implements RiskReportService {

    @Override
    public Result<Map<String, Object>> getHouseReport(Long houseId) {
        // TODO: 等待GIS组提供数据，生成房屋体检报告
        Map<String, Object> report = new HashMap<>();
        report.put("houseId", houseId);
        report.put("riskScore", 85);
        report.put("riskLevel", "中风险");
        report.put("details", "报告功能开发中，等待GIS组数据");
        return Result.success(report);
    }

    @Override
    public Result<Map<String, Object>> getAreaReport(String areaCode) {
        // TODO: 等待GIS组提供数据，生成区域风险报告
        Map<String, Object> report = new HashMap<>();
        report.put("areaCode", areaCode);
        report.put("riskScore", 75);
        report.put("riskLevel", "中风险");
        report.put("details", "区域报告功能开发中");
        return Result.success(report);
    }
}