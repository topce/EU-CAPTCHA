import ecs = require('aws-cdk-lib/aws-ecs');
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import ec2 = require('aws-cdk-lib/aws-ec2');
import cdk = require('aws-cdk-lib');

export class EuCaptchaCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a cluster
    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, 'cluster', {
      vpc,
    });
    // Create Fargate Service
    const fargateService = new ecs_patterns.NetworkLoadBalancedFargateService(
      this,
      'redis',
      {
        cluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry('redis:alpine'),
          containerPort: 6379,
        },
        publicLoadBalancer: false,
        listenerPort: 6379,
        healthCheckGracePeriod: cdk.Duration.minutes(5),
        desiredCount: 1,
      }
    );
    const appLbFargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        'appService',
        {
          cluster,
          cpu: 1024,
          memoryLimitMiB: 2048,
          taskImageOptions: {
            image: ecs.ContainerImage.fromRegistry('topce/eu-captcha'),
            environment: {
              REDIS: fargateService.loadBalancer.loadBalancerDnsName,
            },
          },
          publicLoadBalancer: true,
        }
      );

    // Setup AutoScaling policy
    const scaling = appLbFargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    new cdk.CfnOutput(this, 'RedisLoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: appLbFargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}
