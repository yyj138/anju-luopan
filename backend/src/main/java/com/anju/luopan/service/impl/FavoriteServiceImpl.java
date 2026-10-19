package com.anju.luopan.service.impl;

import com.anju.luopan.entity.UserFavorite;
import com.anju.luopan.mapper.UserFavoriteMapper;
import com.anju.luopan.service.FavoriteService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FavoriteServiceImpl implements FavoriteService {

    @Autowired
    private UserFavoriteMapper userFavoriteMapper;

    @Override
    public void addFavorite(Long userId, Long houseId) {
        // 检查是否已收藏
        if (!isFavorited(userId, houseId)) {
            UserFavorite favorite = new UserFavorite();
            favorite.setUserId(userId);
            favorite.setHouseId(houseId);
            userFavoriteMapper.insert(favorite);
        }
    }

    @Override
    public void removeFavorite(Long userId, Long houseId) {
        // 标准 MyBatis-Plus 条件删除（完全匹配你的 Mapper）
        QueryWrapper<UserFavorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        wrapper.eq("house_id", houseId);
        userFavoriteMapper.delete(wrapper);
    }

    @Override
    public List<Long> getFavoriteHouseIds(Long userId) {
        return userFavoriteMapper.selectHouseIdsByUserId(userId);
    }

    @Override
    public boolean isFavorited(Long userId, Long houseId) {
        // 直接调用你 Mapper 里的 exists 方法
        return userFavoriteMapper.existsByUserIdAndHouseId(userId, houseId);
    }
}