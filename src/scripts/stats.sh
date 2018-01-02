eval $(docker-machine env $DM)
docker stats $CID
sleep 1