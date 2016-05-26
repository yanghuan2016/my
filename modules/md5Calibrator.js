function Md5Calibrator(md5) {
    this.md5 = md5;
}

Md5Calibrator.prototype.calculateMd5Checksum = function (buffer) {
    return this.md5(buffer);
};

Md5Calibrator.prototype.calculateMd5ChecksumWithTime = function (buffer) {
    var now = new Date().getTime().toString();
    return this.calculateMd5Checksum(buffer + now);
};

module.exports = Md5Calibrator;