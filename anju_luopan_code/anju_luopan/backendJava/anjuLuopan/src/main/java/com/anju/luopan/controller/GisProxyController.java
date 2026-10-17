package com.anju.luopan.controller;

import com.anju.luopan.util.Result;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/gis")
public class GisProxyController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String GIS_SERVICE_URL = "http://localhost:8080";

    // 30分钟通勤圈数据（对接GIS组）
    @GetMapping("/commute-circle/{houseId}")
    public Result<Map<String, Object>> getCommuteCircle(@PathVariable Long houseId) {
        try {
            String url = GIS_SERVICE_URL + "/commute-circle/" + houseId;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error("调用GIS服务失败: " + e.getMessage());
        }
    }

    // 热力图数据
    @GetMapping("/heatmap")
    public Result<Map<String, Object>> getHeatmapData(@RequestParam String area) {
        try {
            String url = GIS_SERVICE_URL + "/heatmap?area=" + area;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error("调用GIS服务失败: " + e.getMessage());
        }
    }

    // 职住平衡比统计
    @GetMapping("/job-housing-ratio")
    public Result<Map<String, Object>> getJobHousingRatio(@RequestParam String area) {
        try {
            String url = GIS_SERVICE_URL + "/job-housing-ratio?area=" + area;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error("调用GIS服务失败: " + e.getMessage());
        }
    }

    // ======================== 以下是新增地图接口（不影响你原有功能）========================

    // 房源统计（地图必需）
    @GetMapping("/houses/stats")
    public Result<?> getHousesStats(@RequestParam Map<String, String> params) {
        try {
            String url = GIS_SERVICE_URL + "/houses/stats?" + String.join("&",
                    params.entrySet().stream()
                            .map(e -> e.getKey() + "=" + e.getValue())
                            .toArray(String[]::new)
            );
            Object response = restTemplate.getForObject(url, Object.class);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error("获取房源统计失败: " + e.getMessage());
        }
    }

    // 地图热力图（地图必需）
    @GetMapping("/houses/heatmap")
    public Result<?> getHousesHeatmap(@RequestParam Map<String, String> params) {
        try {
            String url = GIS_SERVICE_URL + "/houses/heatmap?" + String.join("&",
                    params.entrySet().stream()
                            .map(e -> e.getKey() + "=" + e.getValue())
                            .toArray(String[]::new)
            );
            Object response = restTemplate.getForObject(url, Object.class);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error("获取热力图数据失败: " + e.getMessage());
        }
    }

    // 附近房源（地图必需）
    @GetMapping("/houses/nearby")
    public Result<?> getNearbyHouses(@RequestParam Map<String, String> params) {
        try {
            String url = GIS_SERVICE_URL + "/houses/nearby?" + String.join("&",
                    params.entrySet().stream()
                            .map(e -> e.getKey() + "=" + e.getValue())
                            .toArray(String[]::new)
            );
            Object response = restTemplate.getForObject(url, Object.class);
            return Result.success(response);
        } catch (Exception e) {
            return Result.error("获取附近房源失败: " + e.getMessage());
        }
    }
}