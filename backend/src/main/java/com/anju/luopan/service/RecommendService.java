package com.anju.luopan.service;

import com.anju.luopan.entity.HouseInfo;
import com.anju.luopan.util.Result;
import java.util.List;
import java.util.Map;

public interface RecommendService {
    // 为用户推荐房源
    Result<List<Map<String, Object>>> recommendHouses(Long userId);

    // 获取热门房源
    Result<List<Map<String, Object>>> getHotHouses();

    // 个性化推荐
    List<HouseInfo> getPersonalizedRecommendations(Map<String, Object> params);

    // 默认推荐（热门房源、最新上线房源或优质精选房源）
    List<HouseInfo> getDefaultRecommendations(int pageSize);

    // 获取推荐标签
    List<String> getRecommendTags();
}