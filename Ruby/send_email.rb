require 'smtp'

$default_options = {
  server: 'SERVER_URL',
  port: 0,
  helo_domain: 'HELO_DOMAIN',
  username: 'USER@DOMAIN.TLD',
  password: 'PASSWORD',
  auth_type: :plain,
  from_name: 'YOUR NAME',
  from_address: 'FROM_ADDRESS'
}

# Sends text email via SMTP
def send_email(opts)
  opts = $default_options.merge(opts)

message = <<EOM
From: #{opts[:from_name]} <#{opts[:from_address]}>
To: #{opts[:to]}
Subject: #{opts[:subject]}

#{opts[:body]}
EOM

  Net::SMTP.start(opts[:server], opts[:port], opts[:helo_domain], opts[:username], opts[:password], opts[:auth_type]) do |smtp|
    smtp.send_message message, opts[:from_address], opts[:to]
  end
end

# Send SMTP email with file attachment
def send_email_with_attachment(opts, attachment_path)
  opts = $default_options.merge(opts)
  marker = 'MARKER'

  if File.exist?(attachment_path)
    attachment_data = [File.read(attachment_path)].pack('m')
    filename        = File.basename(attachment_path)

# Define main headers
main_headers = <<EOF
From: #{opts[:from_name]} <#{opts[:from_address]}>
To: #{opts[:to]}
Subject: #{opts[:subject]}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary=#{marker}

--#{marker}
EOF

# Define the message action
body = <<EOF
Content-Type: text/plain
Content-Transfer-Encoding:8bit

#{opts[:body]}
--#{marker}
EOF

# Define the attachment section
attachment = <<EOF
Content-Type: image/jpeg; name=#{filename}
Content-Transfer-Encoding:base64
Content-Disposition: attachment; filename=#{filename}

#{attachment_data}
--#{marker}--
EOF

    message = main_headers + body + attachment

    Net::SMTP.start(opts[:server], opts[:port], opts[:helo_domain], opts[:username], opts[:password], opts[:auth_type]) do |smtp|
      smtp.send_message message, opts[:from_address], opts[:to]
    end
  else
    puts "The requested file attachment does not exist."
  end
end
