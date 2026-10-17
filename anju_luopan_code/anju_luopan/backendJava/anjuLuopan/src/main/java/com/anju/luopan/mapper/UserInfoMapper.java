package com.anju.luopan.mapper;

import com.anju.luopan.entity.UserInfo;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserInfoMapper extends BaseMapper<UserInfo> {
    
    @Select("SELECT * FROM user_info WHERE username = #{username}")
    UserInfo selectByUsername(String username);
}
