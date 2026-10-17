# VerifyVision-Pro API 集成指南

本指南提供了如何将VerifyVision-Pro的API集成到您的项目中的详细步骤和示例。

## 1. 启动API服务

### 1.1 训练模型（可选）

如果您需要使用自定义模型，可以按照以下步骤训练：

```bash
# 生成测试数据
python generate_test_images.py

# 预处理图像
python main.py preprocess --input-dir data/real --output-dir data/processed/real --target-size 224 224
python main.py preprocess --input-dir data/fake --output-dir data/processed/fake --target-size 224 224

# 训练模型
python main.py train --real-dir data/processed/real --fake-dir data/processed/fake --model cnn --pretrained --epochs 5 --batch-size 4 --save-dir models/saved
```

### 1.2 启动Web服务

使用训练好的模型启动Web服务：

```bash
python main.py web --model-path models/saved/best_model.pth --model-name cnn --port 8080 --debug
```

服务将在 `http://localhost:8080` 上运行。

## 2. API接口说明

### 2.1 主要接口

- **URL**: `http://localhost:8080/api/analyze`
- **方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `file`: 图片文件（必需），支持JPG、JPEG、PNG格式
  - `fields`: 可选，逗号分隔的字段列表，如 `fields=p_image,ocr,room_quality`

### 2.2 响应结构

```json
{
  "p_image": { "label": "伪造|真实", "prob": 0-100 },
  "ai_generated": { "status": "available|unavailable", "label"?: "...", "prob"?: 0-100 },
  "piracy": { "status": "available|unavailable", "is_infringing": boolean, "match_count": int, "top_results": [] },
  "room_quality": { "tier": "high|medium|low", "scores": { "overall": int, "decor": int, "safety": int }, "cheap_decor_risk": "low|medium|high", "formaldehyde_risk_hint": string },
  "ocr": { "status": "available|unavailable", "text": string, "words"?: string[] }
}
```

## 3. 集成示例

### 3.1 Python示例

```python
import requests

url = "http://localhost:8080/api/analyze"

# 发送图片文件
files = {
    'file': open('path/to/room.jpg', 'rb')
}

# 可选：指定要返回的字段
data = {
    'fields': 'p_image,ocr,room_quality'
}

response = requests.post(url, files=files, data=data)

if response.status_code == 200:
    result = response.json()
    print("检测结果:")
    print(f"图片真实性: {result['p_image']['label']} (置信度: {result['p_image']['prob']:.2f}%)")
    print(f"房间质量等级: {result['room_quality']['tier']}")
    print(f"装修风险: {result['room_quality']['cheap_decor_risk']}")
    print(f"甲醛风险提示: {result['room_quality']['formaldehyde_risk_hint']}")
else:
    print(f"请求失败: {response.json()['error']}")
```

### 3.2 cURL示例

```bash
# 基本调用
curl -X POST "http://localhost:8080/api/analyze" \
  -F "file=@path/to/room.jpg"

# 指定返回字段
curl -X POST "http://localhost:8080/api/analyze" \
  -F "file=@path/to/room.jpg" \
  -F "fields=p_image,ocr,room_quality"
```

### 3.3 PowerShell示例

```powershell
$uri = "http://localhost:8080/api/analyze"
$filePath = "path/to/room.jpg"
$fileName = (Get-Item $filePath).Name
$boundary = [System.Guid]::NewGuid().ToString()

$request = [System.Net.HttpWebRequest]::Create($uri)
$request.Method = "POST"
$request.ContentType = "multipart/form-data; boundary=$boundary"

$stream = $request.GetRequestStream()

# 写入表单数据
$formData = "--$boundary`r`nContent-Disposition: form-data; name=`"file`"; filename=`"$fileName`"`r`nContent-Type: image/jpeg`r`n`r`n"
$formDataBytes = [System.Text.Encoding]::UTF8.GetBytes($formData)
$stream.Write($formDataBytes, 0, $formDataBytes.Length)

# 写入文件内容
$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$stream.Write($fileBytes, 0, $fileBytes.Length)

# 写入结束边界
$endBoundary = "`r`n--$boundary--`r`n"
$endBoundaryBytes = [System.Text.Encoding]::UTF8.GetBytes($endBoundary)
$stream.Write($endBoundaryBytes, 0, $endBoundaryBytes.Length)

$stream.Close()

try {
    $response = $request.GetResponse()
    $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
    $responseText = $reader.ReadToEnd()
    $reader.Close()
    $response.Close()
    
    # 解析JSON响应
    $result = $responseText | ConvertFrom-Json
    Write-Output "检测结果:"
    Write-Output "图片真实性: $($result.p_image.label) (置信度: $($result.p_image.prob.ToString('0.00'))%)"
    Write-Output "房间质量等级: $($result.room_quality.tier)"
    Write-Output "装修风险: $($result.room_quality.cheap_decor_risk)"
    Write-Output "甲醛风险提示: $($result.room_quality.formaldehyde_risk_hint)"
} catch {
    Write-Output "请求失败: $($_.Exception.Response)"
}
```

## 4. 集成到最终项目

### 4.1 后端集成

在您的后端服务中，可以创建一个服务类来封装API调用：

```python
class VerifyVisionService:
    def __init__(self, api_url="http://localhost:8080/api/analyze"):
        self.api_url = api_url
    
    def analyze_image(self, image_path, fields=None):
        """
        分析图像并返回结果
        """
        files = {'file': open(image_path, 'rb')}
        data = {} if fields is None else {'fields': fields}
        
        response = requests.post(self.api_url, files=files, data=data)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API调用失败: {response.json()['error']}")
```

### 4.2 前端集成

在前端应用中，可以使用JavaScript的Fetch API或Axios来调用API：

```javascript
// 使用Fetch API
async function analyzeImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fields', 'p_image,ocr,room_quality');
    
    try {
        const response = await fetch('http://localhost:8080/api/analyze', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            const error = await response.json();
            throw new Error(error.error);
        }
    } catch (error) {
        console.error('分析失败:', error);
        throw error;
    }
}

// 使用示例
const fileInput = document.getElementById('image-upload');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const result = await analyzeImage(file);
            console.log('分析结果:', result);
            // 显示结果到UI
        } catch (error) {
            alert('分析失败: ' + error.message);
        }
    }
});
```

## 5. 部署建议

### 5.1 生产环境部署

1. **使用Gunicorn作为WSGI服务器**：
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8080 "src.web.app:app"
   ```

2. **使用Nginx作为反向代理**：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **启用HTTPS**：使用Let's Encrypt获取SSL证书。

### 5.2 性能优化

- **使用GPU加速**：如果有可用的GPU，确保PyTorch使用CUDA。
- **模型量化**：使用`python main.py quantize`命令量化模型，减少模型大小并提高推理速度。
- **批量推理**：对于批量处理，可以使用`python main.py batch-inference`命令。

## 6. 故障排除

### 6.1 常见问题

1. **API返回400错误**：
   - 检查是否正确上传了文件
   - 确保文件格式是JPG、JPEG或PNG
   - 检查文件大小是否超过限制（默认5MB）

2. **OCR功能不可用**：
   - 确保安装了Tesseract OCR引擎
   - 对于Windows，下载并安装Tesseract：https://github.com/UB-Mannheim/tesseract/wiki
   - 对于macOS，运行：`brew install tesseract`
   - 对于Ubuntu，运行：`sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim`

3. **AI生成检测不可用**：
   - 需要使用多任务模型，启动服务时添加`--multi-task`参数
   - 确保训练了多任务模型：`python main.py train-multi`

4. **房间质量分析不准确**：
   - 确保OCR功能正常工作
   - 图像中包含清晰的文本信息
   - 家具检测需要YOLO模型，确保`yolov8n.pt`文件存在

## 7. 最佳实践

1. **错误处理**：在集成时添加适当的错误处理，处理API调用失败的情况。
2. **超时设置**：为API调用设置合理的超时时间，避免长时间阻塞。
3. **缓存策略**：对于相同的图像，可以缓存分析结果，减少重复调用。
4. **批量处理**：对于大量图像，考虑使用批量处理API或异步处理。
5. **安全措施**：限制API访问，防止滥用；使用HTTPS加密传输。

## 8. 联系支持

如果您在集成过程中遇到任何问题，请参考项目的README.md文件或联系项目维护者。

---

**注意**：本指南基于VerifyVision-Pro v1.0版本，如有更新，请参考最新文档。