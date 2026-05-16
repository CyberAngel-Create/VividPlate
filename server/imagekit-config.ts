import ImageKit from 'imagekit';

// Initialize ImageKit with your credentials
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_h+rY6vKHMytUwU6pu1pmjnUIPq8=",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_cS+6CyZ8tp1BqV5npQhBzW4CuY8=",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/vividplate"
});

export default imagekit;