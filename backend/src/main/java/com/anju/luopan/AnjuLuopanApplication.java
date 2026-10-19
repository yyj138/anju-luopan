package com.anju.luopan;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.anju.luopan.mapper")
public class AnjuLuopanApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnjuLuopanApplication.class, args);
    }
}