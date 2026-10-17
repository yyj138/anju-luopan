package com.anju.luopan.controller;

import com.anju.luopan.entity.HouseInfo;
import com.anju.luopan.mapper.HouseInfoMapper;
import com.anju.luopan.service.HouseService;
import com.anju.luopan.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 房源接口（对接前端/api/houses + 保留所有查询功能）
 */
@RestController
@RequestMapping("/api/houses") // 核心：改成前端要求的路径
public class HouseController {

    // 保留原有Mapper和Service依赖
    @Autowired
    private HouseInfoMapper houseInfoMapper;

    @Autowired
    private HouseService houseService;

    // 🔥 前端需要的核心接口：GET /api/houses 查所有房源
    @GetMapping
    public Result<List<HouseInfo>> getHouses() {
        List<HouseInfo> houses = houseService.findAll();
        return Result.success(houses);
    }

    // ✅ 保留：按ID查询房源详情 (接口路径：/api/houses/detail/{id})
    @GetMapping("/detail/{id}")
    public Result<HouseInfo> getHouseDetail(@PathVariable Long id) {
        HouseInfo house = houseInfoMapper.selectById(id);
        if (house == null) {
            return Result.error("房源不存在");
        }
        return Result.success(house);
    }

    // ✅ 保留：分页查询房源 (接口路径：/api/houses/page)
    @GetMapping("/page")
    public Result<Map<String, Object>> getHousesByPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size) {
        return houseService.getHousesByPage(page, size);
    }

    // ✅ 保留：搜索房源 (接口路径：/api/houses/search)
    @PostMapping("/search")
    public Result<List<HouseInfo>> searchHouses(@RequestBody Map<String, Object> params) {
        return houseService.searchHouses(params);
    }

    // ✅ 保留：记录房源浏览 (接口路径：/api/houses/view/{houseId})
    @PostMapping("/view/{houseId}")
    public Result<Void> recordView(@RequestParam Long userId,
                                   @PathVariable Long houseId) {
        houseService.recordView(userId, houseId);
        return Result.success();
    }
}