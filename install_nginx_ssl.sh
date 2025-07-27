#!/bin/bash

# FileCodeBox Nginx + SSL 一键安装配置脚本
# 支持Ubuntu/Debian和CentOS/RHEL系统

set -e

echo "🎵 FileCodeBox HTTPS配置安装脚本"
echo "=================================="

# 检测操作系统
if [ -f /etc/debian_version ]; then
    OS="debian"
    echo "🐧 检测到Debian/Ubuntu系统"
elif [ -f /etc/redhat-release ]; then
    OS="rhel"
    echo "🎩 检测到RHEL/CentOS系统"
else
    echo "❌ 不支持的操作系统"
    exit 1
fi

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root权限运行此脚本"
    echo "   sudo $0"
    exit 1
fi

SERVER_IP="192.168.1.102"
NGINX_CONF="/etc/nginx/sites-available/filecodebox"
NGINX_ENABLED="/etc/nginx/sites-enabled/filecodebox"

echo "📋 配置信息:"
echo "   服务器IP: $SERVER_IP"
echo "   FileCodeBox端口: 12345"
echo "   HTTPS端口: 443"

# 安装nginx
echo ""
echo "📦 安装Nginx..."
if [ "$OS" = "debian" ]; then
    apt update
    apt install -y nginx openssl
elif [ "$OS" = "rhel" ]; then
    yum install -y epel-release
    yum install -y nginx openssl
fi

# 启动并启用nginx
systemctl enable nginx
systemctl start nginx

# 创建SSL证书目录
echo "📁 创建SSL目录..."
mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# 生成SSL证书
echo "🔐 生成SSL证书..."
cat > filecodebox.conf <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=CN
ST=Local
L=Local
O=FileCodeBox
OU=Audio Recording
CN=${SERVER_IP}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
IP.1 = ${SERVER_IP}
IP.2 = 127.0.0.1
DNS.1 = localhost
EOF

openssl genrsa -out filecodebox.key 2048
openssl req -new -x509 -key filecodebox.key -out filecodebox.crt -days 365 -config filecodebox.conf -extensions v3_req

chmod 600 filecodebox.key
chmod 644 filecodebox.crt

# 创建nginx配置
echo "⚙️  创建Nginx配置..."
cat > $NGINX_CONF <<'EOF'
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name 192.168.1.102;
    return 301 https://$server_name$request_uri;
}

# HTTPS服务器配置
server {
    listen 443 ssl http2;
    server_name 192.168.1.102;
    
    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/filecodebox.crt;
    ssl_certificate_key /etc/nginx/ssl/filecodebox.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 5m;
    
    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # 客户端最大上传大小
    client_max_body_size 100M;
    
    # 反向代理到FileCodeBox
    location / {
        proxy_pass http://127.0.0.1:12345;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:12345;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 音频文件优化
    location ~* \.(mp3|wav|ogg|webm|m4a|aac|flac)$ {
        proxy_pass http://127.0.0.1:12345;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        add_header Accept-Ranges bytes;
    }
    
    # API接口不缓存
    location /share/ {
        proxy_pass http://127.0.0.1:12345;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # 日志
    access_log /var/log/nginx/filecodebox_access.log;
    error_log /var/log/nginx/filecodebox_error.log;
}
EOF

# 启用站点配置
if [ "$OS" = "debian" ]; then
    ln -sf $NGINX_CONF $NGINX_ENABLED
    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default
else
    # CentOS/RHEL系统，直接包含配置
    echo "include $NGINX_CONF;" >> /etc/nginx/nginx.conf
fi

# 测试nginx配置
echo "🔍 测试Nginx配置..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx配置测试通过"
else
    echo "❌ Nginx配置测试失败"
    exit 1
fi

# 重启nginx
echo "🔄 重启Nginx..."
systemctl restart nginx

# 配置防火墙
echo "🔥 配置防火墙..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "✅ UFW防火墙规则已添加"
elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "✅ Firewalld防火墙规则已添加"
fi

# 检查FileCodeBox服务状态
echo "🔍 检查FileCodeBox服务..."
if curl -s http://127.0.0.1:12345 >/dev/null; then
    echo "✅ FileCodeBox服务运行正常"
else
    echo "⚠️  FileCodeBox服务可能未运行"
    echo "   请确保FileCodeBox在127.0.0.1:12345端口运行"
fi

echo ""
echo "🎉 安装配置完成!"
echo "=================="
echo ""
echo "📋 访问信息:"
echo "   HTTPS地址: https://${SERVER_IP}/themes/audio_record.html"
echo "   HTTP重定向: http://${SERVER_IP} → https://${SERVER_IP}"
echo ""
echo "🔍 SSL证书信息:"
openssl x509 -in /etc/nginx/ssl/filecodebox.crt -noout -dates
echo ""
echo "⚠️  重要提醒:"
echo "   1. 首次访问会显示SSL证书警告，点击'高级'→'继续访问'"
echo "   2. 自签名证书只适用于内网测试环境"
echo "   3. 生产环境建议使用权威CA签发的证书"
echo ""
echo "🔧 管理命令:"
echo "   查看日志: tail -f /var/log/nginx/filecodebox_*.log"
echo "   重启nginx: systemctl restart nginx"
echo "   检查状态: systemctl status nginx"
echo ""
echo "🎤 现在可以访问 https://${SERVER_IP}/themes/audio_record.html 进行音频录制!" 