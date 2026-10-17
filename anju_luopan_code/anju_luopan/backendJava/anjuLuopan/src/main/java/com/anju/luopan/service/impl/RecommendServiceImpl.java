package com.anju.luopan.service.impl;

import com.anju.luopan.entity.HouseInfo;
import com.anju.luopan.mapper.HouseInfoMapper;
import com.anju.luopan.service.RecommendService;
import com.anju.luopan.util.Result;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class RecommendServiceImpl implements RecommendService {

    @Autowired
    private HouseInfoMapper houseInfoMapper;

    @Override
    public Result<List<Map<String, Object>>> recommendHouses(Long userId) {
        // TODO: 等待AI组提供推荐算法接口
        return Result.error("推荐功能开发中，等待AI组接口");
    }

    @Override
    public Result<List<Map<String, Object>>> getHotHouses() {
        // TODO: 根据浏览记录和收藏量计算热门房源
        return Result.error("热门房源功能开发中");
    }

    @Override
    public List<HouseInfo> getPersonalizedRecommendations(Map<String, Object> params) {
        // 这里实现个性化推荐逻辑
        // 根据参数进行过滤
        QueryWrapper<HouseInfo> queryWrapper = new QueryWrapper<>();
        
        // 地址过滤 - 支持模糊匹配
        if (params.containsKey("companyAddress") && params.get("companyAddress") != null && !params.get("companyAddress").toString().isEmpty()) {
            String companyAddress = params.get("companyAddress").toString();
            queryWrapper.and(wrapper -> wrapper.like("完整地址", companyAddress));
        }
        
        // 户型过滤 - 支持模糊匹配
        if (params.containsKey("roomType") && params.get("roomType") != null && !params.get("roomType").toString().isEmpty()) {
            String roomType = params.get("roomType").toString();
            // 将"两居"转换为"2室"这样的格式进行匹配
            final String searchPattern;
            if (roomType.contains("一")) {
                searchPattern = "1室";
            } else if (roomType.contains("二") || roomType.contains("两")) {
                searchPattern = "2室";
            } else if (roomType.contains("三")) {
                searchPattern = "3室";
            } else if (roomType.contains("四")) {
                searchPattern = "4室";
            } else {
                searchPattern = roomType;
            }
            
            queryWrapper.and(wrapper -> wrapper.like("户型", searchPattern));
        }
        
        // 朝向过滤
        if (params.containsKey("orientation") && params.get("orientation") != null && !params.get("orientation").toString().isEmpty()) {
            String orientation = params.get("orientation").toString();
            queryWrapper.and(wrapper -> wrapper.like("朝向", orientation));
        }
        
        // 租房类型过滤
        if (params.containsKey("rentType") && params.get("rentType") != null && !params.get("rentType").toString().isEmpty()) {
            String rentType = params.get("rentType").toString();
            queryWrapper.and(wrapper -> wrapper.like("租赁方式", rentType));
        }
        
        // 租期过滤
        if (params.containsKey("rentDuration") && params.get("rentDuration") != null && !params.get("rentDuration").toString().isEmpty()) {
            String originalRentDuration = params.get("rentDuration").toString();
            String processedRentDuration = originalRentDuration.replaceAll("\\(.*?\\)", "").trim();
            queryWrapper.and(wrapper -> wrapper.like("类型", processedRentDuration));
        }
        
        // 标签过滤
        if (params.containsKey("tags") && params.get("tags") != null) {
            final List<String> tags = (List<String>) params.get("tags");
            if (!tags.isEmpty()) {
                queryWrapper.and(wrapper -> {
                    for (int i = 0; i < tags.size(); i++) {
                        final String originalTag = tags.get(i);
                        final String processedTag = originalTag.replaceAll("\\(.*?\\)", "").trim();
                        if (i == 0) {
                            wrapper.like("标题", processedTag);
                        } else {
                            wrapper.or().like("标题", processedTag);
                        }
                    }
                });
            }
        }
        
        // 如果没有任何筛选条件，返回默认推荐（随机房源）
        boolean hasFilter = params.containsKey("companyAddress") && params.get("companyAddress") != null && !params.get("companyAddress").toString().isEmpty()
            || params.containsKey("roomType") && params.get("roomType") != null && !params.get("roomType").toString().isEmpty()
            || params.containsKey("orientation") && params.get("orientation") != null && !params.get("orientation").toString().isEmpty()
            || params.containsKey("rentType") && params.get("rentType") != null && !params.get("rentType").toString().isEmpty()
            || params.containsKey("rentDuration") && params.get("rentDuration") != null && !params.get("rentDuration").toString().isEmpty()
            || params.containsKey("tags") && params.get("tags") != null && ((List<?>) params.get("tags")).size() > 0;
        
        if (!hasFilter) {
            // 没有筛选条件，返回默认推荐（随机房源）
            // 从params中获取pageSize，默认为100
            int pageSize = 100;
            if (params.containsKey("pageSize")) {
                try {
                    pageSize = Integer.parseInt(params.get("pageSize").toString());
                } catch (Exception e) {
                    // 解析失败，使用默认值
                }
            }
            return getDefaultRecommendations(pageSize);
        }
        
        // 限制返回数量为1000条
        queryWrapper.last("LIMIT 1000");
        
        List<HouseInfo> result = houseInfoMapper.selectList(queryWrapper);
        
        // 如果筛选后没有结果，返回默认推荐
        if (result == null || result.isEmpty()) {
            // 从params中获取pageSize，默认为100
            int pageSize = 100;
            if (params.containsKey("pageSize")) {
                try {
                    pageSize = Integer.parseInt(params.get("pageSize").toString());
                } catch (Exception e) {
                    // 解析失败，使用默认值
                }
            }
            return getDefaultRecommendations(pageSize);
        }
        
        return result;
    }

    @Override
    public List<String> getRecommendTags() {
        // 返回推荐标签列表
        List<String> tags = new ArrayList<>();
        tags.add("精装修");
        tags.add("拎包入住");
        tags.add("电梯");
        tags.add("家电齐全");
        tags.add("地铁口");
        tags.add("一室一厅");
        tags.add("急租");
        tags.add("南北通透");
        tags.add("单间");
        tags.add("停车方便");
        return tags;
    }

    @Override
    public List<HouseInfo> getDefaultRecommendations(int pageSize) {
        // 默认推荐：显示随机房源
        QueryWrapper<HouseInfo> queryWrapper = new QueryWrapper<>();
        
        // 使用传入的pageSize限制返回数量
        queryWrapper.last("LIMIT " + pageSize);
        
        return houseInfoMapper.selectList(queryWrapper);
    }
}