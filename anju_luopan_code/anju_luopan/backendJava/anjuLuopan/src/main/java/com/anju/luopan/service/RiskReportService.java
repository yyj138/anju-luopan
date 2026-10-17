package com.anju.luopan.service;

import com.anju.luopan.util.Result;
import java.util.Map;

public interface RiskReportService {
    // 获取房屋体检报告
    Result<Map<String, Object>> getHouseReport(Long houseId);

    // 获取区域风险报告
    Result<Map<String, Object>> getAreaReport(String areaCode);
}