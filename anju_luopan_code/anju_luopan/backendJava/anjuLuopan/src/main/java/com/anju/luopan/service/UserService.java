package com.anju.luopan.service;

import com.anju.luopan.entity.UserInfo;
import com.anju.luopan.util.Result;
import java.util.Map;

public interface UserService {

    // 已按要求修改
    void register(UserInfo userInfo);

    // 已按要求修改
    UserInfo login(String username, String password);

    // 保留你原来的两个接口，不动
    Result<UserInfo> getUserInfo(Long id);
    Result<UserInfo> updateUserInfo(UserInfo userInfo);
}