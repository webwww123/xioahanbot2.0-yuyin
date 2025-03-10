const fs = require('fs');
const path = require('path');

// WAV文件头部结构
const createWavHeader = (dataLength) => {
    const buffer = Buffer.alloc(44);
    
    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    
    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // fmt chunk size
    buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
    buffer.writeUInt16LE(1, 22); // number of channels
    buffer.writeUInt32LE(16000, 24); // sample rate
    buffer.writeUInt32LE(16000 * 2, 28); // byte rate
    buffer.writeUInt16LE(2, 32); // block align
    buffer.writeUInt16LE(16, 34); // bits per sample
    
    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    
    return buffer;
};

// 创建测试音频数据 (复合正弦波)
const createTestAudioData = () => {
    const sampleRate = 16000;
    const duration = 3; // 3秒
    const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4 音符
    const samples = sampleRate * duration;
    const buffer = Buffer.alloc(samples * 2); // 16位采样，每个采样2字节
    
    for (let i = 0; i < samples; i++) {
        let value = 0;
        // 每秒播放一个音符
        const currentFreq = frequencies[Math.floor(i / sampleRate) % frequencies.length];
        value = Math.sin(2 * Math.PI * currentFreq * i / sampleRate) * 32767 * 0.8;
        buffer.writeInt16LE(Math.floor(value), i * 2);
    }
    
    return buffer;
};

// 生成测试WAV文件
const generateTestWav = () => {
    const audioData = createTestAudioData();
    const header = createWavHeader(audioData.length);
    
    const wavFile = path.join(__dirname, 'test.wav');
    const fileStream = fs.createWriteStream(wavFile);
    
    fileStream.write(header);
    fileStream.write(audioData);
    fileStream.end();
    
    console.log('已生成测试WAV文件:', wavFile);
    console.log('文件大小:', header.length + audioData.length, '字节');
    console.log('采样率: 16000Hz');
    console.log('时长: 3秒');
    console.log('格式: 16位PCM');
};

generateTestWav(); 