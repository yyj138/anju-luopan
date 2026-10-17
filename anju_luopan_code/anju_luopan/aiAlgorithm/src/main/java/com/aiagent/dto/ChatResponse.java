package com.aiagent.dto;

import lombok.Data;

@Data
public class ChatResponse {
    private String reply;
    private String sessionId;
}