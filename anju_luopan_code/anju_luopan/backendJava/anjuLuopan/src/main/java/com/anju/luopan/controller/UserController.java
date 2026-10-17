package com.anju.luopan.controller;

import com.anju.luopan.entity.UserInfo;
import com.anju.luopan.service.UserService;
import com.anju.luopan.util.Result;
import com.anju.luopan.util.JwtUtil;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public Result<?> register(@RequestBody UserInfo userInfo) {
        userService.register(userInfo);
        return Result.success("注册成功");
    }

    @PostMapping("/login")
    public Result<?> login(@RequestBody UserInfo userInfo) {
        UserInfo user = userService.login(userInfo.getUsername(), userInfo.getPassword());
        String token = JwtUtil.generateToken(user.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("user", user);
        data.put("token", token);
        return Result.success(data);
    }

    // 以下是你原来保留的接口，保持不变
    @GetMapping("/info/{id}")
    public Result<UserInfo> getUserInfo(@PathVariable Long id) {
        return userService.getUserInfo(id);
    }

    @PutMapping("/info")
    public Result<UserInfo> updateUserInfo(@RequestBody UserInfo userInfo) {
        return userService.updateUserInfo(userInfo);
    }
}