package com.anju.luopan.mapper;

import com.anju.luopan.entity.HouseViewHistory;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HouseViewHistoryMapper extends BaseMapper<HouseViewHistory> {
    // BaseMapper 已经提供了 insert、selectById 等方法
}