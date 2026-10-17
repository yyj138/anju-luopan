package com.aiagent.dto;

import lombok.Data;

@Data
public class ChatMessage {
    private String role;     // user / agent
    private String content;
    
    public ChatMessage() {}
    
    public ChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }
}