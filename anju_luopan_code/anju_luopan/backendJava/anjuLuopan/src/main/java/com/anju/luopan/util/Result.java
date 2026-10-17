package com.anju.luopan.util;

import lombok.Data;

/**
 * 统一接口返回格式
 */
@Data
public class Result<T> {
    private Integer code; // 200成功，500失败
    private String msg;   // 提示信息
    private T data;       // 返回数据

    // 成功（带数据）
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg("操作成功");
        result.setData(data);
        return result;
    }

    // 成功（无数据）
    public static <T> Result<T> success() {
        return success(null);
    }

    // 失败
    public static <T> Result<T> error(String msg) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMsg(msg);
        result.setData(null);
        return result;
    }
}