# 英语学习应用

一个功能丰富的英语学习应用，支持多种难度级别和自定义学习内容，通过逐字母填空的方式练习中英文句子翻译。

## 📸 效果展示

### 设置页面
![设置页面](首页设置页.png)

### 自定义学习内容
![自定义语句](自定义语句.png)

### 演示视频

<video src="效果演示视频.mov" controls width="800">
  您的浏览器不支持视频播放。
</video>

## ✨ 功能特点

### 核心功能
- **逐字母填空**：每个字母对应一个下划线，单词之间根据长度自动间隔
- **实时反馈**：提交后正确字母显示绿色，错误字母显示红色
- **自动语音朗读**：使用浏览器Web Speech API（完全免费），自动朗读英文
- **多难度支持**：CET-4（四级）、CET-6（六级）、IELTS（雅思）
- **用户自定义**：支持上传Excel文件，使用自定义学习内容
- **播放模式**：随机播放或顺序播放
- **学习历史**：支持查看上一题，记录学习进度

### 交互功能
- **键盘快捷键**：
  - `Enter`：提交答案（输入时）或进入下一题（结果显示时）
  - `Ctrl+'`（Mac: `Cmd+'`）：播放当前句子
- **自动聚焦**：加载新题目后自动聚焦输入框
- **进度显示**：顺序播放模式下显示学习进度

## 🛠 技术栈

- **后端**: Flask + SQLite + Pandas
- **前端**: React + Vite
- **语音**: 浏览器Web Speech API（免费，无需后端处理）

## 📋 前置要求

- **Python 3.7+** （后端需要）
- **Node.js 16+ 和 npm** （前端需要）

### 安装 Node.js

在 macOS 上，推荐使用以下方式之一：

**方式1：使用 Homebrew（推荐）**
```bash
brew install node
```

**方式2：从官网下载**
访问 https://nodejs.org/ 下载并安装 LTS 版本

**方式3：使用 nvm（Node Version Manager）**
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js
nvm install --lts
nvm use --lts
```

安装完成后，验证安装：
```bash
node --version
npm --version
```

## 🚀 安装和运行

### 后端

1. 进入后端目录：
```bash
cd backend
```

2. 安装Python依赖：
```bash
pip3 install -r requirements.txt
```

3. 初始化数据库（如果还没有数据）：
```bash
python3 init_data.py
```

这将导入：
- 50条CET-6（六级）句子
- 50条CET-4（四级）句子
- 50条IELTS（雅思）句子

4. 启动Flask服务器：
```bash
python3 app.py
```

后端将在 http://localhost:5001 运行

### 前端

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端将在 http://localhost:3000 运行

## 📖 使用说明

### 基本使用流程

1. **选择学习设置**
   - 打开浏览器访问 http://localhost:3000
   - 在设置页面选择难度级别（可多选）：
     - CET-4（四级）
     - CET-6（六级）
     - IELTS（雅思）
     - 用户自定义（上传Excel文件）
   - 选择播放方式：
     - 随机播放：随机显示题目
     - 顺序播放：按顺序显示题目，显示进度
   
   ![设置页面示例](首页设置页.png)

2. **开始学习**
   - 点击"开始学习"按钮
   - 页面中央显示中文句子，同时自动朗读对应的英文
   - 在下方逐字母输入英文翻译（每个字母对应一个下划线）
   - 标点符号会自动显示，无需填写

3. **提交答案**
   - 点击"提交"按钮或按`Enter`键
   - 系统会逐个字符对比：
     - 正确的字母显示绿色
     - 错误的字母显示红色
   - 自动重新朗读正确答案

4. **继续学习**
   - 点击"下一题"或按`Enter`键继续
   - 点击"上一题"可以回顾之前的题目
   - 点击"播放"按钮可以重新播放当前句子

### 用户自定义功能

1. **准备Excel文件**
   - 第一列：中文句子
   - 第二列：英文句子
   - 不需要表头，直接是数据

2. **上传文件**
   - 在设置页面选择"用户自定义"
   - 点击"选择Excel文件"上传
   - 系统会自动解析并显示加载的句子数量
   - 选择播放方式后点击"开始学习"

   ![自定义功能示例](自定义语句.png)

3. **使用自定义数据**
   - 自定义数据仅在本次学习会话中使用
   - 不会保存到数据库
   - 支持随机和顺序两种播放模式

## 📁 项目结构

```
english/
├── backend/              # Flask后端
│   ├── app.py           # Flask主应用和API接口
│   ├── models.py        # 数据库模型
│   ├── database.py      # 数据库配置
│   ├── init_data.py     # 初始化数据脚本
│   ├── update_data.py   # 更新数据脚本
│   ├── import_excel.py  # Excel数据导入脚本（命令行）
│   ├── requirements.txt # Python依赖
│   └── sentences.db     # SQLite数据库文件
├── frontend/            # React前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── SettingsPage.jsx    # 设置页面组件
│   │   │   ├── SettingsPage.css
│   │   │   ├── LearningCard.jsx    # 学习卡片组件
│   │   │   └── LearningCard.css
│   │   ├── services/
│   │   │   └── api.js              # API调用服务
│   │   ├── App.jsx                 # 主应用组件
│   │   ├── App.css
│   │   ├── main.jsx                 # 入口文件
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 📊 数据管理

### 从Excel文件导入数据到数据库

可以使用命令行脚本批量导入句子数据到数据库：

```bash
cd backend
python3 import_excel.py <excel_file_path>
```

**Excel文件格式：**
- 第一列：中文句子
- 第二列：英文句子
- 第三列：难度级别（可选，cet4/cet6/ielts，默认为cet6）

**示例：**
```bash
# 导入数据
python3 import_excel.py sentences.xlsx

# 导入指定路径的文件
python3 import_excel.py /path/to/sentences.xlsx
```

**注意事项：**
- 脚本会自动跳过空行和重复的句子（基于中文和英文）
- 如果第三列为空或无效值，默认使用cet6
- 每100条数据会自动提交一次，确保数据安全

### 更新现有数据

如果需要更新现有数据的难度标记或添加新数据：

```bash
cd backend
python3 update_data.py
```

## 🎯 API接口

### 后端API

- `GET /api/sentence/random?difficulties=cet4,cet6` - 获取随机句子（支持难度筛选）
- `GET /api/sentences/list?difficulties=cet4,cet6` - 获取句子列表（用于顺序播放）
- `GET /api/sentence/:id` - 获取指定ID的句子
- `POST /api/check` - 检查用户答案
- `POST /api/upload-excel` - 上传并解析Excel文件（用于用户自定义）

## ⌨️ 键盘快捷键

- **Enter键**：
  - 输入时：提交答案
  - 结果显示时：进入下一题
- **Ctrl+'**（Mac: **Cmd+'**）：播放当前句子

## ⚠️ 注意事项

- 确保后端服务在运行，前端才能正常获取数据
- 语音功能需要浏览器支持Web Speech API（现代浏览器都支持）
- 数据库文件 `sentences.db` 会自动创建在backend目录下
- 导入Excel数据前，需要先安装依赖：`pip3 install pandas openpyxl`
- 用户自定义的Excel文件仅在当前会话中使用，不会保存到数据库
- 如果遇到语音播放问题，可以点击"播放"按钮手动播放

## 🔧 故障排除

### 前端无法连接后端
- 检查后端是否在 http://localhost:5001 运行
- 检查浏览器控制台是否有错误信息

### 语音无法播放
- 检查浏览器是否支持Web Speech API
- 尝试点击"播放"按钮手动播放
- 某些浏览器需要用户交互后才能播放音频

### Excel文件上传失败
- 确保文件格式为 .xlsx 或 .xls
- 确保文件至少包含2列（中文、英文）
- 检查文件是否包含有效数据（非空行）

## 📝 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
