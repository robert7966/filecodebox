#!/bin/bash

# FileCodeBox SSL证书生成脚本
# 用于在内网环境生成自签名SSL证书

echo "🔐 正在为FileCodeBox生成SSL证书..."

# 创建SSL目录
sudo mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# 设置变量
SERVER_IP="192.168.1.102"
CERT_DAYS=365
CERT_NAME="filecodebox"

echo "📋 证书信息:"
echo "   服务器IP: $SERVER_IP"
echo "   有效期: $CERT_DAYS 天"
echo "   证书名称: $CERT_NAME"

# 生成私钥
echo "🔑 生成私钥..."
sudo openssl genrsa -out ${CERT_NAME}.key 2048

# 创建证书配置文件
echo "📝 创建证书配置..."
sudo tee ${CERT_NAME}.conf > /dev/null <<EOF
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

# 生成证书签名请求和自签名证书
echo "📄 生成自签名证书..."
sudo openssl req -new -x509 -key ${CERT_NAME}.key -out ${CERT_NAME}.crt -days $CERT_DAYS -config ${CERT_NAME}.conf -extensions v3_req

# 设置权限
echo "🔒 设置证书权限..."
sudo chmod 600 ${CERT_NAME}.key
sudo chmod 644 ${CERT_NAME}.crt
sudo chown root:root ${CERT_NAME}.*

# 显示证书信息
echo "✅ SSL证书生成完成!"
echo ""
echo "📁 证书文件位置:"
echo "   私钥: /etc/nginx/ssl/${CERT_NAME}.key"
echo "   证书: /etc/nginx/ssl/${CERT_NAME}.crt"
echo ""
echo "🔍 证书详细信息:"
sudo openssl x509 -in ${CERT_NAME}.crt -text -noout | grep -A 5 "Subject:"
sudo openssl x509 -in ${CERT_NAME}.crt -text -noout | grep -A 3 "Subject Alternative Name"

echo ""
echo "⚠️  重要提醒:"
echo "   1. 这是自签名证书，浏览器会显示安全警告"
echo "   2. 首次访问时需要点击'高级'→'继续访问'"
echo "   3. 可以将证书添加到浏览器信任列表"
echo ""
echo "🚀 下一步操作:"
echo "   1. 重启nginx: sudo systemctl restart nginx"
echo "   2. 访问: https://${SERVER_IP}/themes/audio_record.html"
echo "   3. 接受证书警告并继续访问" 