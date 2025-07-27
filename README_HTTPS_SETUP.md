# FileCodeBox HTTPS 配置指南

本指南将帮助您为FileCodeBox配置HTTPS，以支持音频录制功能。

## 🎯 为什么需要HTTPS？

现代浏览器（Chrome、Firefox、Safari、Edge）出于安全考虑，只允许在HTTPS环境下访问麦克风和摄像头API。因此，要使用音频录制功能，必须配置HTTPS。

## 🚀 快速安装（推荐）

### 一键安装脚本

```bash
# 下载并运行安装脚本
wget https://your-domain.com/install_nginx_ssl.sh
chmod +x install_nginx_ssl.sh
sudo ./install_nginx_ssl.sh
```

### 手动安装步骤

## 📋 前置要求

- Linux服务器（Ubuntu/Debian 或 CentOS/RHEL）
- Root权限
- FileCodeBox已运行在 `127.0.0.1:12345`

## 🔧 手动配置步骤

### 步骤1：安装Nginx

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install -y nginx openssl
```

#### CentOS/RHEL:
```bash
sudo yum install -y epel-release
sudo yum install -y nginx openssl
```

### 步骤2：生成SSL证书

```bash
# 创建SSL目录
sudo mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# 生成证书（将下载的脚本放在这里）
sudo bash generate_ssl_cert.sh
```

### 步骤3：配置Nginx

创建nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/filecodebox
```

复制提供的nginx配置内容。

### 步骤4：启用配置

#### Ubuntu/Debian:
```bash
sudo ln -s /etc/nginx/sites-available/filecodebox /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

#### CentOS/RHEL:
```bash
# 直接编辑主配置文件
sudo nano /etc/nginx/nginx.conf
# 在http块中添加: include /etc/nginx/sites-available/filecodebox;
```

### 步骤5：测试并重启

```bash
# 测试配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 步骤6：配置防火墙

#### UFW (Ubuntu):
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### Firewalld (CentOS):
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 🔍 验证配置

### 检查服务状态
```bash
# 检查nginx状态
sudo systemctl status nginx

# 检查FileCodeBox服务
curl -I http://127.0.0.1:12345

# 检查HTTPS访问
curl -k -I https://192.168.1.102
```

### 查看日志
```bash
# Nginx访问日志
sudo tail -f /var/log/nginx/filecodebox_access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/filecodebox_error.log
```

## 🌐 访问音频录制功能

配置完成后，访问：
```
https://192.168.1.102/themes/audio_record.html
```

### 首次访问证书警告处理

1. 浏览器会显示"您的连接不是私密连接"警告
2. 点击"高级"或"Advanced"
3. 点击"继续访问192.168.1.102（不安全）"或"Proceed to 192.168.1.102 (unsafe)"
4. 现在可以正常使用音频录制功能

## 🔒 证书信息

### 查看证书详情
```bash
# 查看证书信息
sudo openssl x509 -in /etc/nginx/ssl/filecodebox.crt -text -noout

# 查看证书有效期
sudo openssl x509 -in /etc/nginx/ssl/filecodebox.crt -noout -dates
```

### 更新证书
```bash
# 重新生成证书（365天有效期）
cd /etc/nginx/ssl
sudo bash generate_ssl_cert.sh
sudo systemctl reload nginx
```

## 🛠️ 故障排除

### 常见问题

#### 1. "502 Bad Gateway" 错误
```bash
# 检查FileCodeBox是否运行
curl http://127.0.0.1:12345

# 检查nginx配置
sudo nginx -t
```

#### 2. SSL证书错误
```bash
# 重新生成证书
cd /etc/nginx/ssl
sudo bash generate_ssl_cert.sh
sudo systemctl restart nginx
```

#### 3. 防火墙阻止访问
```bash
# 检查防火墙状态
sudo ufw status
# 或
sudo firewall-cmd --list-all
```

#### 4. 权限问题
```bash
# 检查SSL文件权限
ls -la /etc/nginx/ssl/
# 应该显示：
# -rw-r--r-- filecodebox.crt
# -rw------- filecodebox.key
```

### 调试命令

```bash
# 测试HTTPS连接
curl -k https://192.168.1.102

# 检查端口监听
sudo netstat -tlnp | grep :443

# 检查nginx进程
ps aux | grep nginx
```

## 📱 移动设备访问

确保移动设备与服务器在同一网络：

1. **Android**: 在Chrome中接受证书警告
2. **iOS**: 在Safari中接受证书警告
3. **确保网络连通**: `ping 192.168.1.102`

## 🔄 升级和维护

### 定期任务
```bash
# 检查证书有效期（每月）
sudo openssl x509 -in /etc/nginx/ssl/filecodebox.crt -noout -dates

# 更新nginx（根据系统）
sudo apt update && sudo apt upgrade nginx  # Ubuntu/Debian
sudo yum update nginx                      # CentOS/RHEL

# 备份配置文件
sudo cp /etc/nginx/sites-available/filecodebox /backup/
```

## 🎉 成功标志

配置成功后，您应该能够：

1. ✅ 通过 `https://192.168.1.102` 访问FileCodeBox
2. ✅ HTTP自动重定向到HTTPS
3. ✅ 音频录制页面正常加载
4. ✅ 浏览器允许麦克风权限访问
5. ✅ 成功录制和上传音频文件

现在您可以享受完整的音频录制和分享功能了！🎤 