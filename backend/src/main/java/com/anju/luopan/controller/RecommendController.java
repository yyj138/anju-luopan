package com.anju.luopan.controller;

import com.anju.luopan.entity.HouseInfo;
import com.anju.luopan.service.RecommendService;
import com.anju.luopan.util.Result;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommend")
public class RecommendController {

    @Autowired
    private RecommendService recommendService;

    // 个性化推荐（支持分页）
    @PostMapping("/personalized")
    public Result getPersonalizedRecommendations(@RequestBody Map<String, Object> params) {
        try {
            // 获取分页参数，默认第1页，每页100条
            int pageNum = params.containsKey("pageNum") ? Integer.parseInt(params.get("pageNum").toString()) : 1;
            int pageSize = params.containsKey("pageSize") ? Integer.parseInt(params.get("pageSize").toString()) : 100;
            
            List<HouseInfo> recommendations = recommendService.getPersonalizedRecommendations(params);
            
            // 模拟分页返回
            Map<String, Object> result = new HashMap<>();
            result.put("list", recommendations);
            result.put("total", recommendations.size());
            result.put("pageNum", pageNum);
            result.put("pageSize", pageSize);
            
            return Result.success(result);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("推荐失败");
        }
    }

    // 默认推荐（支持分页）
    @GetMapping("/default")
    public Result getDefaultRecommendations(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "100") int pageSize) {
        try {
            List<HouseInfo> recommendations = recommendService.getDefaultRecommendations(pageSize);
            
            // 模拟分页返回
            Map<String, Object> result = new HashMap<>();
            result.put("list", recommendations);
            result.put("total", recommendations.size());
            result.put("pageNum", pageNum);
            result.put("pageSize", pageSize);
            
            return Result.success(result);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取默认推荐失败");
        }
    }

    // 获取推荐标签
    @GetMapping("/tags")
    public Result getRecommendTags() {
        try {
            List<String> tags = recommendService.getRecommendTags();
            return Result.success(tags);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("获取标签失败");
        }
    }
}

