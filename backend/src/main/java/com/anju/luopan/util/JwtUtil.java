package com.anju.luopan.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    // 密钥
    private static final String SECRET = "anjuLuopanSecretKey2026!@#$%^&*()_+";

    // 过期时间 7天
    private static final long EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000;

    private static Key getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    // 只接收 userId
    public static String generateToken(Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE_TIME))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ 新增：parseToken 方法
    public static Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 验证 token
    public static boolean verifyToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 从 token 获取 userId
    public static Long getUserIdFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.get("userId", Long.class);
        } catch (Exception e) {
            return null;
        }
    }

    // 获取用户名（保留，但现在不会存进去了）
    public static String getUsernameFromToken(String token) {
        return null;
    }
}