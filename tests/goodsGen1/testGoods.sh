#!/usr/bin/env bash
for num in $( seq 1003 2000)
do
cat ./goodsAdd.sql | sed -e "s/gsId/${num}/g" -e "s/gsguid/guid${num}/g" -e "s/gsname/name${num}/g" -e "s/gsbname/biemingname${num}/g" -e "s/gszz/zhunzihao${num}/g" -e "s/gspinying/pinying${num}/g" -e "s/gskunum/skuNo${num}/g" >> ./goodsgoods.sql
done