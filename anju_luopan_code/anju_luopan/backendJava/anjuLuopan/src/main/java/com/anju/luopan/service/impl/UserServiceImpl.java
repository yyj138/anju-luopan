package com.anju.luopan.service.impl;

import com.anju.luopan.entity.UserInfo;
import com.anju.luopan.mapper.UserInfoMapper;
import com.anju.luopan.service.UserService;
import com.anju.luopan.util.Result;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDateTime;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserInfoMapper userInfoMapper;

    // 注册（完全按你给的格式修改）
    @Override
    public void register(UserInfo userInfo) {
        // 检查用户名是否已存在
        UserInfo existingUser = userInfoMapper.selectByUsername(userInfo.getUsername());
        if (existingUser != null) {
            throw new RuntimeException("用户名已存在");
        }
        // 密码加密
        userInfo.setPassword(DigestUtils.md5DigestAsHex(userInfo.getPassword().getBytes()));
        // 补全时间
        userInfo.setCreateTime(LocalDateTime.now());
        userInfo.setUpdateTime(LocalDateTime.now());
        // 保存用户
        userInfoMapper.insert(userInfo);
    }

    // 登录（完全按你给的格式修改）
    @Override
    public UserInfo login(String username, String password) {
        // 查找用户
        UserInfo user = userInfoMapper.selectByUsername(username);
        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }
        // 验证密码
        if (!DigestUtils.md5DigestAsHex(password.getBytes()).equals(user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        return user;
    }

    // 以下保留你原来的方法
    @Override
    public Result<UserInfo> getUserInfo(Long id) {
        UserInfo user = userInfoMapper.selectById(id);
        if (user == null) {
            return Result.error("用户不存在");
        }
        user.setPassword(null);
        return Result.success(user);
    }

    @Override
    public Result<UserInfo> updateUserInfo(UserInfo userInfo) {
        userInfo.setUpdateTime(LocalDateTime.now());
        userInfoMapper.updateById(userInfo);

        UserInfo updatedUser = userInfoMapper.selectById(userInfo.getId());
        if (updatedUser != null) {
            updatedUser.setPassword(null);
        }
        return Result.success(updatedUser);
    }
}