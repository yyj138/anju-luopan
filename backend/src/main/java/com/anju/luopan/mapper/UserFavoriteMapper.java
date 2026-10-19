package com.anju.luopan.mapper;

import com.anju.luopan.entity.UserFavorite;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;

public interface UserFavoriteMapper extends BaseMapper<UserFavorite> {
    
    List<Long> selectHouseIdsByUserId(Long userId);

    boolean existsByUserIdAndHouseId(Long userId, Long houseId);
}