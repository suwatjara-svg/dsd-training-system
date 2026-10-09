import { google } from 'googleapis';

const DEFAULT_SERVICE_EMAIL = "dsd-bot@citric-kit-511103-m3.iam.gserviceaccount.com";
const DEFAULT_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9YGtq0G8i0ISc\nj3cwugbcuTKlZxI3I5292EYOeiU5L2qpT8l80KDLlibAKZJLwGNIYvT+Q1CfRu1I\nf2jQ8shQ/rB5aJ6vdOtYfUIO6KCAIFBx0iqdp8W7Myyt+GmOsfKHuj6DgUQsD5sb\nnj4qPrtnWVSlo18KJomWQIfhO8jaqwFiDV2rLD1vUQNoahu0BFOzyLHBjpxAM9j3\nrhfkRnGxmcsNF95bowBMutNt3BMYIA8wRnx+u+C4Tkd1J2CzMNWvBb621uNX8R9z\nVsJdbMW4S5bNwbLxH/6w2lbu/95kn2MCTXETqVtREpdAbd9qkZCsIQYlMC0uPa6C\nZZYnBEo/AgMBAAECggEAFPy9is3ksygGuk8P9392STnhCgGdPC0fSy3PvcT9oRPH\nL1JfUwzP9SAD1WIGC40bs6b73b3aDnzOyS0NkbKGTqubJSlaBLnhZyIikwJm3yw1\nnhebj3NLb46hUfpowF6qMS6LxQkrY/Kqzum/m/Dt1etJfT3Yx4gz0Un/hQ+aF9mQ\nyKlgl6nU4eVtatpBq3m77qZ83aI6pa/z9BmV/cltpf+YU9bDEByC8E14f53L+OI3\n0CuXcXc/hy9oPrUMNTxQx4Xn0ygplcBEuuewVOpri5Oy9tIJMis/rTNNOXj3kw8D\nii81QVNTZnsFCJr1ZJuxt3zW4DcCTplepJAjR0koiQKBgQDviTq0qUpMVG5tyD6/\nT2SY1wYB9S1auY1PuYJZjmhB4t5APDSSxs8XwK3XNZWX68R8QuugRBup7UiY0GD9\nQGTdClZt5V3ZsdlumjJ4A912nfTQZn2Iyy+8yEa/TIJHF9Bn2F4La9rigRnIt9bA\nNPm7mbD5mf+13dOhUHGH4o6EmwKBgQDKZJt9TKl97Uyz25uIvlBNwkZsHpuvkgyo\n5JbAJ7bw+2rZnQA8kg7pDA3NjK6Lkw+pisomLOzygQps51izzUsAXjyk/HmKTc25\nsGqiqGqZuKAR63Fr4Hxn0Y+YK+CQNuY5Hw17j3cspm+bVSo+WQx0Is7Z2z1ZHwJY\njk7/uw0hLQKBgQDdAG3rlW35csTYATLza5rS8UCXuc/4rs3USsIbQqqqb1jDR0jy\nSv9zWNCLiOLWYi7MvymKmowzgbvDUi7KOglVb15C0qZ+XfrQcvAxjs9by2y+gnE8\nLsuCj/3GLh7c3PnpddV/ECnJZXeWmxdGCxqGncyM3irxbxL8+K1mw/7eFQKBgE3V\nIOKvv6KYxl2If6i3n4Q3yQM9Rhvfq5Sry7l7zGOiHDYxpWylsqw2oXxBtMIiPOyz\nXggOUNT1gP/efAMxWL18gA/mtArW3t2hFXEWGWCiWpRpmcWln9IBChq4DPUI18Jx\nyaqRwn/eRZ9TwhoV/q8Oz8OCB3alcS6DE6hO077FAoGATnfLyUshpHL4MxPQetPC\nwObZplgQqUbi8qbJnJLq32w1ZK6JWauuOJeVcxJhBbrORDFzIrtaJSfhwC79KOU8\nhpWkGg64RuHVmLVRjnocjFIHGA3MZldy1npXwC3dwKwdfNtkxunB3ZqSgWvQbX3E\nZl4aLy2llUbZcqvYL6UOhSY=\n-----END PRIVATE KEY-----\n";

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
