import { google } from 'googleapis';

const DEFAULT_SERVICE_EMAIL = 'dsd-bot@citric-kit-511103-m3.iam.gserviceaccount.com';
const DEFAULT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9YGtq0G8i0ISc
j3cwugbcuTKlZxI3I5292EYOeiU5L2qpT8l80KDLlibAKZJLwGNIYvT+Q1CfRu1I
f2jQ8shQ/rB5aJ6vdOtYfUIO6KCAIFBx0iqdp8W7Myyt+GmOsfKHuj6DgUQsD5sb
nj4qPrtnWVSlo18KJomWQIfhO8jaqwFiDV2rLD1vUQNoahu0BFOzyLHBjpxAM9j3
rhfkRnGxmcsNF95bowBMutNt3BMYIA8wRnx+u+C4Tkd1J2CzMNWvBb621uNX8R9z
VsJdbMW4S5bNwbLxH/6w2lbu/95kn2MCTXETqVtREpdAbd9qkZCsIQYlMC0uPa6C
ZZYnBEo/AgMBAAECggEAFPy9is3ksygGuk8P9392STnhCgGdPC0fSy3PvcT9oRPH
L1JfUwzP9SAD1WIGC40bs6b73b3aDnzOyS0NkbKGTqubJSlaBLnhZyIikwJm3yw1
nhebj3NLb46hUfpowF6qMS6LxQkrY/Kqzum/m/Dt1etJfT3Yx4gz0Un/hQ+aF9mQ
yKlgl6nU4eVtatpBq3m77qZ83aI6pa/z9BmV/cltpf+YU9bDEByC8E14f53L+OI3
0CuXcXc/hy9oPrUMNTxQx4Xn0ygplcBEuuewVOpri5Oy9tIJMis/rTNNOXj3kw8D
ii81QVNTZnsFCJr1ZJuxt3zW4DcCTplepJAjR0koiQKBgQDviTq0qUpMVG5tyD6/
T2SY1wYB9S1auY1PuYJZjmhB4t5APDSSxs8XwK3XNZWX68R8QuugRBup7UiY0GD9
QGTdClZt5V3ZsdlumjJ4A912nfTQZn2Iyy+8yEa/TIJHF9Bn2F4La9rigRnIt9bA
NPm7mbD5mf+13dOhUHGH4o6EmwKBgQDKZJt9TKl97Uyz25uIvlBNwkZsHpuvkgyo
5JbAJ7bw+2rZnQA8kg7pDA3NjK6Lkw+pisomLOzygQps51izzUsAXjyk/HmKTc25
sGqiqGqZuKAR63Fr4Hxn0Y+YK+CQNuY5Hw17j3cspm+bVSo+WQx0Is7Z2z1ZHwJY
jk7/uw0hLQKBgQDdAG3rlW35csTYATLza5rS8UCXuc/4rs3USsIbQqqqb1jDR0jy
Sv9zWNCLiOLWYi7MvymKmowzgbvDUi7KOglVb15C0qZ+XfrQcvAxjs9by2y+gnE8
LsuCj/3GLh7c3PnpddV/ECnJZXeWmxdGCxqGncyM3irxbxL8+K1mw/7eFQKBgE3V
IOKvv6KYxl2If6i3n4Q3yQM9Rhvfq5Sry7l7zGOiHDYxpWylsqw2oXxBtMIiPOyz
XggOUNT1gP/efAMxWL18gA/mtArW3t2hFXEWGWCiWpRpmcWln9IBChq4DPUI18Jx
yaqRwn/eRZ9TwhoV/q8Oz8OCB3alcS6DE6hO077FAoGATnfLyUshpHL4MxPQetPC
wObZplgQqUbi8qbJnJLq32w1ZK6JWauuOJeVcxJhBbrORDFzIrtaJSfhwC79KOU8
hWkGg64RuHVmLVRjnocjFIHGA3MZldy1npXwC3dwKwdfNtkxunB3ZqSgWvQbX3E
Zl4aLy2llUbZcqvYL6UOhSY=
-----END PRIVATE KEY-----`;

export function getGoogleAuthClient(scopes: string[]) {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || DEFAULT_SERVICE_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return new google.auth.JWT(
    serviceEmail,
    undefined,
    privateKey,
    scopes
  );
}
