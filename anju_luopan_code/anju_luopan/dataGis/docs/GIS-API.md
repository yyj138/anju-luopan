
### `docs/GIS-API.md` 示例

```markdown
# GIS 微服务 API 文档

**基础 URL**: `http://8.134.109.200:8000`（示例，实际根据部署修改）

## 通用说明
- 所有接口返回 JSON 格式。
- 错误时返回 `{"detail": "错误信息"}`，状态码为 4xx 或 5xx。

---

## 1. 健康检查
**GET** `/health`

返回服务状态。

**响应示例**:
```json
{"status": "ok"}