export interface Sample {
  label: string;
  hint: string;
  value: string;
}

export const SAMPLES: Sample[] = [
  {
    label: 'URL-encoded PHP',
    hint: 'LFI source leak',
    value: `%3C%3Fphp%0A%24db%20%3D%20new%20mysqli%28%27localhost%27%2C%20%27admin%27%2C%20%27S3cr3t_P4ss%21%27%2C%20%27app%27%29%3B%0Aif%20%28%24db-%3Econnect_error%29%20%7B%0A%20%20die%28%27Connection%20failed%27%29%3B%0A%7D%0Aecho%20%27Connected%27%3B`,
  },
  {
    label: 'JWT',
    hint: 'auth token',
    value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW5pc3RyYXRvciIsImlhdCI6MTcxOTY1NDQwMH0.dummsignaturehere1234567890`,
  },
  {
    label: 'Base64 → nginx.conf',
    hint: 'SSRF read',
    value: `c2VydmVyIHsKICAgIGxpc3RlbiA4MDsKICAgIHJvb3QgL3Zhci93d3cvaHRtbDsKICAgIGxvY2F0aW9uIC9hcGkgewogICAgICAgIHByb3h5X3Bhc3MgaHR0cDovLzEyNy4wLjAuMTo5MDkwOwogICAgfQp9`,
  },
  {
    label: '/etc/passwd',
    hint: 'file disclosure',
    value: `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
hr-smith:x:1001:1001:HR Smith:/home/hr-smith:/bin/bash`,
  },
];
