package com.anju.luopan.service;

import com.anju.luopan.entity.HouseInfo;
import com.anju.luopan.util.Result;
import java.util.List;
import java.util.Map;

public interface HouseService {

    // 【修复：添加 findAll 方法】
    List<HouseInfo> findAll();

    // 获取所有房源
    Result<List<HouseInfo>> getAllHouses();

    // 获取房源详情
    Result<HouseInfo> getHouseDetail(Long id);

    // 搜索房源
    Result<List<HouseInfo>> searchHouses(Map<String, Object> params);

    // 分页查询
    Result<Map<String, Object>> getHousesByPage(int page, int size);

    // 记录浏览
    void recordView(Long userId, Long houseId);
}