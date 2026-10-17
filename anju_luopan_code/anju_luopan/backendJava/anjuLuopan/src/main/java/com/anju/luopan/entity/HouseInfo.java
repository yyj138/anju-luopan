package com.anju.luopan.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("house_geo_new") // 改为使用 house_geo_new 表
public class HouseInfo {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Integer 序号;
    private String 标题;
    private String 价格;
    private String 户型;
    private String 面积;
    private String 租赁方式;
    private String 朝向;
    private String 楼层;
    private String 装修;
    private String 类型;
    private String 经纪人姓名;
    private String 地铁;
    private String 完整地址;
    private Integer 图片数量;
    
    @TableField(value = "\"封面图URL\"")
    private String 封面图URL;
    
    @TableField(value = "\"所有图片URL\"")
    private String 所有图片URL;
    
    @TableField(value = "\"关键词\"")
    private String[] 关键词;
}
