const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

s3.listBuckets((err, data) => {
    if (err) {
        console.error('S3 Connection Error:', err);
    } else {
        console.log('✅ S3 Connected Successfully');
    }
});

const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
};

const uploadProfilePicture = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileExtension = file.mimetype.split('/')[1];
            const fileName = `profile-pictures/${uuidv4()}.${fileExtension}`;
            cb(null, fileName);
        }
    }),
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const uploadBookCover = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileExtension = file.mimetype.split('/')[1];
            const fileName = `book-covers/${uuidv4()}.${fileExtension}`;
            cb(null, fileName);
        }
    }),
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const deleteFromS3 = async (fileUrl) => {
    try {
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1);

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key
        };

        await s3.deleteObject(params).promise();
        console.log('File deleted from S3:', key);
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw error;
    }
};

module.exports = {
    uploadProfilePicture,
    uploadBookCover,
    deleteFromS3,
    s3
};