import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as cw from '@aws-cdk/aws-cloudwatch'

export class EcsThrottlingAlarmStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "vpc", {
      natGateways: 0
    })
    // cluster
    const cluster = new ecs.Cluster(this, "cluster", {
      containerInsights: true,
      vpc
    })  

    // taskdef
    const image = ecs.ContainerImage.fromRegistry("nginx")

    const successTask = new ecs.TaskDefinition(this, "success-task", {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: "256",
      memoryMiB: "512",
    })

    successTask.addContainer("nginx", { image })
  
    const faileTask = new ecs.TaskDefinition(this, "fail-task", {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: "256",
      memoryMiB: "512",
    })
    faileTask.addContainer("nginx", { 
      image, 
      command: [
        "sh",
        "-c",
        "sleep 5"
      ] 
    })

    // service
    const service = new ecs.FargateService(this, "service", {
      cluster,
      taskDefinition: successTask,
      // taskDefinition: faileTask,
      assignPublicIp: true
    })

    // cloudwatch
    const runTaskCount = new cw.Metric({
      metricName: "RunningTaskCount",
      namespace: "ECS/ContainerInsights",
      dimensions: {
        ServiceName: service.serviceName,
        ClusterName: cluster.clusterName
      }
    })
    const desiredTaskCount = new cw.Metric({
      metricName: "DesiredTaskCount",
      namespace: "ECS/ContainerInsights",
      dimensions: {
        ServiceName: service.serviceName,
        ClusterName: cluster.clusterName
      }
    })

    const mathMetric = new cw.MathExpression({
      expression: "x/y",
      usingMetrics: {
        x: runTaskCount,
        y: desiredTaskCount
      }
    })

    mathMetric.createAlarm(this, "alarm", {
      evaluationPeriods: 2,
      threshold: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_THRESHOLD
    })
  }
}