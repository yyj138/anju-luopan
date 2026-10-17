package com.anju.luopan.controller;

import com.anju.luopan.service.FavoriteService;
import com.anju.luopan.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// 创建 FavoriteController.java
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @PostMapping
    public Result<?> addFavorite(@RequestParam Long houseId) {
        Long userId = getCurrentUserId();
        favoriteService.addFavorite(userId, houseId);
        return Result.success("收藏成功");
    }

    @DeleteMapping("/{houseId}")
    public Result<?> removeFavorite(@PathVariable Long houseId) {
        Long userId = getCurrentUserId();
        favoriteService.removeFavorite(userId, houseId);
        return Result.success("取消收藏成功");
    }

    @GetMapping
    public Result<List<Long>> getFavorites() {
        Long userId = getCurrentUserId();
        List<Long> houseIds = favoriteService.getFavoriteHouseIds(userId);
        return Result.success(houseIds);
    }

    @GetMapping("/{houseId}")
    public Result<Boolean> isFavorited(@PathVariable Long houseId) {
        Long userId = getCurrentUserId();
        boolean isFavorited = favoriteService.isFavorited(userId, houseId);
        return Result.success(isFavorited);
    }

    private Long getCurrentUserId() {
        // 从JWT中获取用户ID
        return 1L; // 暂时返回固定值
    }
}