#!/usr/bin/python
# coding: utf8
# By yanghuan@romenscd.cn

import redis
import psutil
import time
import json

"""
获取CPU使用率
"""
def CPU_Info():
    return psutil.cpu_percent(interval=1)

"""
获取磁盘信息
"""
def Disk_Info(mount_point):
    disk = {}
    partition = psutil.disk_partitions()
    for x in range(0,len(partition)):


    disk['total'] = round(float(psutil.disk_usage(mount_point).total) / 1024/ 1024 / 1024,2)
    disk['used'] = round(float(psutil.disk_usage(mount_point).used) / 1024/ 1024 / 1024,2)
    disk['used_percent'] = psutil.disk_usage(mount_point).percent

    return disk

"""
获取网络流量信息
"""
def Inet_Info(device):
    rx = [float(psutil.net_io_counters(pernic=True)['eth0'].bytes_recv),float(psutil.net_io_counters(pernic=True)['eth0'].bytes_sent)]
    time.sleep(1)
    tx = [float(psutil.net_io_counters(pernic=True)['eth0'].bytes_recv),float(psutil.net_io_counters(pernic=True)['eth0'].bytes_sent)]
    speed_in = round((tx[0] - rx[0]) / 1024, 2)
    speed_out = round((tx[1] - rx[1]) /1024, 2)
    return str(speed_in),str(speed_out)


"""
获取内存占用信息
"""
def Mem_Info():
    mem = {}
    mem_info = psutil.virtual_memory()
    mem['used'] = mem_info.used /1024/1024
    mem['total'] = mem_info.total /1024/1024
    mem['percent'] = mem_info.percent
    mem['free'] = mem_info.free /1024/1024
    return mem

"""
redis操作函数
"""
def Redis_Op(k,v):
    json_data = open(r'/home/yh/scc-src/config/sysconfig.json').read()
    data = json.loads(json_data)
    redis_server = data['redis']['host']
    redis_port = data['redis']['port']
    redis_dbNum = data['redis']['dbNum']
    r = redis.StrictRedis(host=redis_server, port=redis_port, db=redis_dbNum)
    r.set(k,v)


if __name__ == '__main__':
    net = {}
    cpu = CPU_Info()
    disk_status = Disk_Info('/')
    mem_status = Mem_Info()
    net['in'], net['out'] = Inet_Info(device='eth0')

    Redis_Op(k='System_CPU_Used',v=cpu)
    Redis_Op(k='System_Disk_Total',v=disk_status['total'])
    Redis_Op(k='System_Disk_Used', v=disk_status['used'])
    Redis_Op(k='System_Disk_Percent', v=disk_status['used_percent'])
    Redis_Op(k='System_Network_In', v=net['in'])
    Redis_Op(k='System_Network_out', v=net['out'])
    Redis_Op(k='System_Mem_Total',v=mem_status['total'])
    Redis_Op(k='System_Mem_Used', v=mem_status['used'])
    Redis_Op(k='System_Mem_Free', v=mem_status['free'])
    Redis_Op(k='System_Mem_Percent', v=mem_status['percent'])
