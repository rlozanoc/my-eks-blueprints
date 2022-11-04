// lib/pipeline.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { KubecostAddOn } from '@kubecost/kubecost-eks-blueprints-addon';
import { TeamPlatform, TeamApplication } from '../teams'; // HERE WE IMPORT TEAMS
import { InstanceType } from 'aws-cdk-lib/aws-ec2';
import { CapacityType, KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { GenericClusterProvider } from '@aws-quickstart/eks-blueprints';


export default class PipelineConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps){
    super(scope, id)

    const account = props?.env?.account!;
    const region = props?.env?.region!;
    
    const addOnKubecost = new KubecostAddOn();
    const addOnAWSLBC = new blueprints.AwsLoadBalancerControllerAddOn();

    // Managed Node Group
    const clusterProvider = new GenericClusterProvider({
      version: KubernetesVersion.V1_21,
      managedNodeGroups: [{
        id: `${id}-nodegroup`,
        instanceTypes: [new InstanceType('t4g.small')],
        minSize: 1,
        maxSize: 10,
        desiredSize: 4
      }],
    })
    
    const blueprint = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns(new blueprints.ClusterAutoScalerAddOn,
            addOnKubecost,
            addOnAWSLBC)
    .clusterProvider(clusterProvider)
    .teams(new TeamPlatform(account), new TeamApplication('burnham',account)); // HERE WE ADD THE TEAMS
  
    blueprints.CodePipelineStack.builder()
      .name("eks-blueprint-workshop-pipeline")
      .owner("rlozanoc")
      .repository({
          repoUrl: 'my-eks-blueprints',
          credentialsSecretName: 'github-token',
          targetRevision: 'main'
      })
      .wave({
        id: "envs",
        stages: [
          { id: "dev", stackBuilder: blueprint.clone('us-west-2')}
        ]
      })
      .build(scope, id+'-stack', props);
  }
}
