import {
  Color,
  EventTouch,
  Node,
  tween,
  Vec3,
} from 'cc';
import type { CategoryId } from '../../games/puzzle/PuzzleTypes';
import { PageController } from '../PageController';

export class HomePage extends PageController {
  show(): void {
    const root = this.resetScreen('Home');
    this.drawFullBackground(root, new Color(242, 236, 218, 255));
    this.createCircle(root, -615, 300, 160, new Color(224, 239, 198, 105));
    this.createCircle(root, 610, -330, 190, new Color(255, 220, 162, 72));
    this.createCircle(root, 42, 350, 78, new Color(205, 235, 224, 70));

    this.createCircle(root, -430, 0, 235, new Color(232, 241, 205, 135));
    this.createCircle(root, -430, -6, 188, new Color(255, 246, 211, 135));
    if (this.frames.has('home-island')) {
      const islandShadow = this.createPanel(
        root,
        'HomeIslandShadow',
        -430,
        -126,
        310,
        58,
        new Color(84, 105, 66, 32),
        29,
      );
      const island = this.createImage(root, 'home-island', -430, 8, 470, 470);
      this.makeHomeIslandInteractive(island, islandShadow);
    } else {
      this.createSproutMark(root, -430, 16, 1.7);
    }
    this.createCategoryCard(root, 'puzzle', -45, 0, new Color(223, 240, 197, 255), new Color(111, 169, 89, 255));
    this.createCategoryCard(root, 'color', 218, 0, new Color(255, 226, 193, 255), new Color(244, 146, 91, 255));
    this.createCategoryCard(root, 'shape', 481, 0, new Color(204, 232, 232, 255), new Color(74, 158, 163, 255));
    this.createVoiceSettingsButton(root);
  }

  private makeHomeIslandInteractive(island: Node, shadow: Node): void {
    const islandRest = island.position.clone();
    const shadowRest = shadow.position.clone();
    let dragging = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const startIdleMotion = () => {
      if (!island.isValid || !shadow.isValid || dragging) {
        return;
      }
      tween(island)
        .stop()
        .repeatForever(
          tween<Node>()
            .to(
              2.4,
              {
                position: new Vec3(islandRest.x, islandRest.y + 4, islandRest.z),
                scale: new Vec3(1.006, 1.006, 1),
                eulerAngles: new Vec3(0.7, -1, 0.25),
              },
              { easing: 'sineInOut' },
            )
            .to(
              2.4,
              {
                position: new Vec3(islandRest.x, islandRest.y - 2, islandRest.z),
                scale: new Vec3(0.998, 0.998, 1),
                eulerAngles: new Vec3(-0.45, 0.8, -0.2),
              },
              { easing: 'sineInOut' },
            ),
        )
        .start();
      tween(shadow)
        .stop()
        .repeatForever(
          tween<Node>()
            .to(
              2.4,
              {
                position: new Vec3(shadowRest.x, shadowRest.y - 2, shadowRest.z),
                scale: new Vec3(0.96, 0.92, 1),
              },
              { easing: 'sineInOut' },
            )
            .to(
              2.4,
              {
                position: new Vec3(shadowRest.x, shadowRest.y + 1, shadowRest.z),
                scale: new Vec3(1.02, 1, 1),
              },
              { easing: 'sineInOut' },
            ),
        )
        .start();
    };

    island.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      const location = event.getUILocation();
      dragging = true;
      this.gameAudio?.play('pickup');
      touchStartX = location.x;
      touchStartY = location.y;
      tween(island).stop();
      tween(shadow).stop();
      island.setPosition(islandRest);
      island.setScale(new Vec3(1.024, 1.024, 1));
      island.eulerAngles = Vec3.ZERO;
      shadow.setPosition(shadowRest);
      shadow.setScale(new Vec3(1.05, 0.9, 1));
    });

    island.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
      if (!dragging) {
        return;
      }
      const location = event.getUILocation();
      const deltaX = location.x - touchStartX;
      const deltaY = location.y - touchStartY;
      const offsetX = this.clamp(deltaX * 0.035, -11, 11);
      const offsetY = this.clamp(deltaY * 0.028, -8, 8);
      const tiltX = this.clamp(-deltaY * 0.035, -5, 5);
      const tiltY = this.clamp(deltaX * 0.04, -7, 7);
      const tiltZ = this.clamp(-deltaX * 0.007, -1.2, 1.2);

      island.setPosition(
        islandRest.x + offsetX,
        islandRest.y + offsetY,
        islandRest.z,
      );
      island.eulerAngles = new Vec3(tiltX, tiltY, tiltZ);
      shadow.setPosition(
        shadowRest.x - offsetX * 0.35,
        shadowRest.y - offsetY * 0.2,
        shadowRest.z,
      );
      shadow.setScale(new Vec3(
        1.04 + Math.abs(tiltY) * 0.006,
        0.9 - Math.abs(tiltX) * 0.008,
        1,
      ));
    });

    const releaseIsland = () => {
      if (!dragging) {
        return;
      }
      dragging = false;
      this.gameAudio?.play('drop');
      tween(island)
        .stop()
        .to(
          0.52,
          {
            position: islandRest,
            scale: Vec3.ONE,
            eulerAngles: Vec3.ZERO,
          },
          { easing: 'backOut' },
        )
        .call(startIdleMotion)
        .start();
      tween(shadow)
        .stop()
        .to(
          0.4,
          {
            position: shadowRest,
            scale: Vec3.ONE,
          },
          { easing: 'quadOut' },
        )
        .start();
    };

    island.on(Node.EventType.TOUCH_END, releaseIsland);
    island.on(Node.EventType.TOUCH_CANCEL, releaseIsland);
    startIdleMotion();
  }

  private createCategoryCard(
    parent: Node,
    category: CategoryId,
    x: number,
    y: number,
    fill: Color,
    accent: Color,
  ): void {
    this.createPanel(parent, 'CategoryShadow', x + 3, y - 8, 230, 420, new Color(91, 75, 53, 20), 44);
    const card = this.createPanel(
      parent,
      `${category}Card`,
      x,
      y,
      230,
      420,
      fill,
      44,
      new Color(255, 255, 244, 200),
      4,
    );
    this.createCircle(card, 0, 52, 98, new Color(255, 255, 245, 185));
    if (category === 'puzzle') {
      if (this.frames.has('shape-regular-selected')) {
        this.createImage(card, 'shape-regular-selected', 0, 56, 166, 166);
      } else {
        this.createPuzzleGridMark(card, 4, 0, 55, true);
      }
    } else if (category === 'color') {
      this.createColorMark(card, 0, 55, 1.15);
    } else {
      this.createShapeMark(card, 0, 55, 1.15);
    }
    this.createCircle(card, 0, -132, 34, accent);
    this.createLabel(card, '›', 2, -128, 43, new Color(255, 255, 244, 255), 50, 50);
    this.makeButton(card, () => this.showCategory(category));
  }

  private createVoiceSettingsButton(parent: Node): void {
    const position = this.getSafeTopRightPosition(66, 66);
    this.createCircle(
      parent,
      position.x,
      position.y - 4,
      35,
      new Color(104, 139, 111, 75),
    ).name = 'VoiceSettingsDepth';
    const button = this.createCircle(
      parent,
      position.x,
      position.y,
      33,
      new Color(111, 169, 126, 255),
    );
    button.name = 'VoiceSettingsButton';
    this.createPanel(
      button,
      'MicrophoneHead',
      0,
      6,
      13,
      25,
      new Color(255, 255, 242, 255),
      7,
    );
    this.createPanel(
      button,
      'MicrophoneStem',
      0,
      -10,
      5,
      11,
      new Color(255, 255, 242, 255),
      3,
    );
    this.createPanel(
      button,
      'MicrophoneBase',
      0,
      -16,
      20,
      5,
      new Color(255, 255, 242, 255),
      3,
    );
    this.createCircle(
      button,
      0,
      -1,
      12,
      new Color(255, 255, 242, 80),
    ).setSiblingIndex(0);
    this.makeButton(button, () => this.showVoiceSettings());
  }

}
