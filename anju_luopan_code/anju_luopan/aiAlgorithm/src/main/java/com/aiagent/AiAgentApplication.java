package com.aiagent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AiAgentApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiAgentApplication.class, args);
        System.out.println("========================================");
        System.out.println("AI Agent 服务启动成功！");
        System.out.println("接口地址: http://localhost:8081/ai/health");
        System.out.println("========================================");
    }
}