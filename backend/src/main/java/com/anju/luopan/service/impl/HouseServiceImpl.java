package com.anju.luopan.service.impl;

import com.anju.luopan.entity.HouseInfo;
import com.anju.luopan.mapper.HouseInfoMapper;
import com.anju.luopan.service.HouseService;
import com.anju.luopan.util.Result;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class HouseServiceImpl implements HouseService {

    @Autowired
    private HouseInfoMapper houseInfoMapper;

    @Override
    public List<HouseInfo> findAll() {
        // 返回所有房源
        return houseInfoMapper.selectList(null);
    }

    @Override
    public Result<List<HouseInfo>> getAllHouses() {
        List<HouseInfo> houses = houseInfoMapper.selectList(null);
        return Result.success(houses);
    }

    @Override
    public Result<HouseInfo> getHouseDetail(Long id) {
        HouseInfo house = houseInfoMapper.selectById(id);
        if (house == null) {
            return Result.error("房源不存在");
        }
        return Result.success(house);
    }

    @Override
    public Result<Map<String, Object>> getHousesByPage(int page, int size) {
        IPage<HouseInfo> housePage = new Page<>(page, size);
        IPage<HouseInfo> result = houseInfoMapper.selectPage(housePage, null);
        
        Map<String, Object> data = Map.of(
            "list", result.getRecords(),
            "total", result.getTotal(),
            "current", result.getCurrent(),
            "size", result.getSize()
        );
        
        return Result.success(data);
    }

    @Override
    public Result<List<HouseInfo>> searchHouses(Map<String, Object> params) {
        // 实现基于区域名称的搜索功能
        List<HouseInfo> houses = houseInfoMapper.selectList(null);
        
        // 检查是否有区域搜索参数
        if (params.containsKey("district")) {
            final String district = (String) params.get("district");
            if (district != null && !district.isEmpty()) {
                // 过滤出包含该区域的房源
                // 处理区域名称，确保能够匹配完整区域名和简称
                final String searchDistrict;
                // 如果用户输入的是简称，如"龙岗"，添加"区"后缀进行匹配
                if (!district.endsWith("区") && !district.endsWith("市")) {
                    searchDistrict = district + "区";
                } else {
                    searchDistrict = district;
                }
                
                houses = houses.stream()
                    .filter(house -> house.get完整地址() != null && 
                            (house.get完整地址().contains(district) || house.get完整地址().contains(searchDistrict)))
                    .collect(java.util.stream.Collectors.toList());
            }
        }
        
        return Result.success(houses);
    }

    @Override
    public void recordView(Long userId, Long houseId) {
        // 记录浏览历史的实现
    }
}
