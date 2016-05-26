#!/usr/bin/python
# coding: utf8
# By yanghuan@romenscd.cn

#执行后会直接将数据写入redis，不会有信息返回，只有报错才会返回信息

import redis
import psutil
import time
import json
import os

"""
redis操作函数
"""
def Redis_Op(k,v):
    json_data = open(r'../config/sysconfig.json').read()
    data = json.loads(json_data)
    redis_server = data['redis']['host']
    redis_port = data['redis']['port']
    redis_dbNum = data['redis']['dbNum']
    r = redis.StrictRedis(host=redis_server, port=redis_port, db=redis_dbNum)
    if r.get(k) < v:
        r.set(k,v)
    else:
        pass

"""
获取CPU使用率
"""
def CPU_Info():
    return psutil.cpu_percent(interval=1)

"""
获取磁盘信息
"""
def Disk_Info():
    partition_list = {}
    partition = psutil.disk_partitions()
    disk_total_list = []
    disk_used_list = []
    disk_percent_list = []
    """将获取到的物理磁盘信息写到json文件"""
    for x in range(0,len(partition)):
        total_name = 'System_Disk_%s_Total' % (partition[x][1])
        used_name = 'System_Disk_%s_Used' % (partition[x][1])
        percent_name = 'System_Disk_%s_Percent' % (partition[x][1])

        disk_total_list.append(total_name)
        disk_used_list.append(used_name)
        disk_percent_list.append(percent_name)
        diskusage = psutil.disk_usage(partition[x][1])
        Redis_Op(total_name,round(float(diskusage.total) / 1024/ 1024 / 1024,2))
        Redis_Op(used_name, round(float(diskusage.used) / 1024 / 1024 / 1024, 2))
        Redis_Op(percent_name, diskusage.percent)

    partition_list['disk_total_list'] = ','.join(disk_total_list)
    partition_list['disk_used_list'] = ','.join(disk_used_list)
    partition_list['disk_percent_list'] = ','.join(disk_percent_list)
    with open('sys_info.json', 'w') as f:
        f.write("partition_list:" + json.dumps(partition_list,indent=2))
    f.close()

"""
获取网络流量信息
"""
def Inet_Info(device):
    rx = [float(psutil.net_io_counters(pernic=True)[device].bytes_recv),float(psutil.net_io_counters(pernic=True)[device].bytes_sent)]
    time.sleep(1)
    tx = [float(psutil.net_io_counters(pernic=True)[device].bytes_recv),float(psutil.net_io_counters(pernic=True)[device].bytes_sent)]
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
获取CPU温度
"""
def CPU_Temp():
    t = os.popen("sensors").read().split("+")[1].split()[0].split("°C")
    return int(t[0])

if __name__ == '__main__':
    net = {}
    cpu = CPU_Info()
    Disk_Info()
    mem_status = Mem_Info()
    cpu_t = CPU_Temp()
    net['in'], net['out'] = Inet_Info(device='eth0')
    Redis_Op(k='System_CPU_Used',v=cpu)
    Redis_Op(k='System_Network_In', v=net['in'])
    Redis_Op(k='System_Network_out', v=net['out'])
    Redis_Op(k='System_Mem_Total',v=mem_status['total'])
    Redis_Op(k='System_Mem_Used', v=mem_status['used'])
    Redis_Op(k='System_Mem_Free', v=mem_status['free'])
    Redis_Op(k='System_Mem_Percent', v=mem_status['percent'])
    Redis_Op(k='System_CPU_Temp', v=cpu_t)
